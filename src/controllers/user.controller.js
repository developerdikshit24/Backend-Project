import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from '../utils/ApiError.js'
import { User } from "../models/user.models.js"
import { deleteFromCloud, uploadOnCloud } from "../utils/cloudnary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"



const generateAccessAndRefreshTokens = async (userId) => {
    try {
        // it can find the user using ObjectId / User Id using Database
        /* Database Request */
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })
        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generate Access and Refresh Token")
    }

}


const registerUser = asyncHandler(async (req, res) => {
    const { userName, email, fullName, password } = req.body

    if ([userName, email, fullName, password].some((field) => field?.trim() == "")) {
        throw new ApiError(400, "All Fields Are Required..")
    }
    if (!email.includes("@")) {
        throw new ApiError(400, "Required Valid Email Id")
    }

    const existedUser = await User.findOne({
        $or: [{ userName }, { email },]
    })

    if (existedUser) {
        throw new ApiError(409, "Username or Email already exist")
    };

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // console.log(req.files);

    // console.log(avatarLocalPath);
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is Required..")
    }

    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }


    const avatar = await uploadOnCloud(avatarLocalPath, "image")
    const coverImage = await uploadOnCloud(coverImageLocalPath, "image")

    if (!avatar) {
        throw new ApiError(400, "Avatar is Required..")
    }

    const user = await User.create({
        fullName,
        userName: userName.toLowerCase(),
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",

    })

    // << This is doing for know data is uploaded or not >>

    const createUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createUser) {
        throw new ApiError(500, "Something Went Wrong While Registering")
    }

    return res.status(201).json(
        new ApiResponse(200, createUser, "User Register Successfully")
    )
})


const loginUser = asyncHandler(async (req, res) => {
    const { userName, email, password } = await req.body

    if (!(userName || email)) {
        throw new ApiError(400, "UserName or Email Required")
    }
    const user = await User.findOne({
        $or: [{ userName }, { email }]
    })

    // console.log(user);
    if (!user) {
        throw new ApiError(400, "User doesnot exist")
    }

    const isVaildPassword = await user.isPasswordCorrect(password)

    if (!isVaildPassword) {
        throw new ApiError(401, "Password is  incorrect");

    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

    const loginUser = await User.findById(user._id).select("-password -refreshToken")

    // cookie required this option 
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                { user: loginUser, refreshToken, accessToken },
                "User Logged in Successfully"
            ))
}
)

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        { $unset: { refreshToken: 1 } },
        { new: true }

    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200, {}, "User logged Out")
        )
}
)

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingToken) {
        throw new ApiError(404, "Unauthorized Access")
    }
    try {
        const deCodedToken = jwt.verify(incomingToken, process.env.REFRESH_TOKEN_SECRET)
        const user = User.findById(deCodedToken?._id)
        if (!user) {
            throw new ApiError(400, "Invaild access request")
        }

        if (incomingToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token is Expired or Used")
        }
        const { accessToken, newrefreshToken } = generateAccessAndRefreshTokens(user._id)

        const options = {
            httpOnly: true,
            secure: true
        }
        res.status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newrefreshToken, options)
            .json(
                new ApiResponse(200,
                    {
                        accessToken,
                        refreshToken: newrefreshToken
                    },
                    "Access Refresh Successfully"
                )
            )
    } catch (error) {
        throw new ApiError(404, error?.message || "Invaild Access Token")
    }

}
)

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invaild Old Password")
    }

    user.password = newPassword;
    user.save({ validateBeforeSave: false })
    return res.status(200)
        .json(new ApiResponse(200,
            {},
            "Password change Successfully"
        ))
}
)

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200)
        .json(new ApiError(200, req.user, "Current user fetch sucessfully"))

}
)

const updateAccountDetail = asyncHandler(async (req, res) => {
    const { fullName, email, userName } = req.body
    if (!fullName || !email || !userName) {
        throw new ApiError(401, 'All feilds are Required')
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email,
                userName

            }
        },
        { new: true }

    ).select("-password -refreshToken")

    return res.status(200).json(new ApiResponse(200, user, "Account Detail Updated"))
}
)

const updateUserAvatar = asyncHandler(async (req, res) => {

    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(401, "Avatar Not Found")
    }

    const userId = await User.findById(req.user?._id)
    const oldAvatar = userId.avatar
    const deleteOldAvatar = await deleteFromCloud(oldAvatar, "image")
    if (!deleteOldAvatar) {
        throw new ApiError(400, "Something went wrong while delete avatar on cloud")
    }

    const avatar = await uploadOnCloud(avatarLocalPath, "image");
    console.log(avatar);

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploding the Avatar")
    }


    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        }, { new: true }
    ).select("-password -refreshToken")

    return res.status(200)
        .json(new ApiResponse(200, { user }, "Avatar Updated Successlly"))
}

)
const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) {
        throw new ApiError(401, "coverImage Not Found")
    }
    const userId = await User.findById(req.user?._id)
    const oldCoverImage = userId.coverImage
    const deleteOldCoverImage = await deleteFromCloud(oldCoverImage, "image")
    if (!deleteOldCoverImage) {
        throw new ApiError(400, "Something went wrong while delete avatar on cloud")
    }

    const coverImage = await uploadOnCloud(coverImageLocalPath, "image");
    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploding the coverImage")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        }, { new: true }
    ).select("-password -refreshToken")

    return res.status(200)
        .json(new ApiResponse(200, { user }, "coverImage Updated Successlly"))
}
)

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing")
    }
    const channel = await User.aggregate([
        {
            $match: {
                userName: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscription",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        }, {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as:"videos"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                publishVideo: {
                    $cond: {
                        if: { $isArray: "$videos" }, // Check if it's an array
                        then: "$videos", // Return the full videos array
                        else: []
                    }
                },
                isSubcribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                userName: 1,
                subscribersCount: 1,
                channelSubscribedToCount: 1,
                isSubcribed: 1,
                publishVideo:1,
                email: 1,
                avatar: 1,
                coverImage: 1
            }
        }


    ])

    if (!channel?.length) {
        throw new ApiError(404, "Channel Does's not Exist")
    }
    return res.status(200).json(
        new ApiResponse(200, channel[0], "User Fetch Successfully")
    )
}
)

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)

            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [{
                    $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner",
                        pipeline: [{
                            $project: {
                                fullName: 1,
                                email: 1,
                                userName: 1
                            }
                        }]
                    }
                },
                {
                    $addFields: {
                        owner: {
                            $first: "$owner"
                        }
                    }
                }

                ]

            }
        }
    ])
    return res.status(200)
        .json(new ApiResponse(200, user[0].watchHistory, "Watch History fetched sucessfully..."))
}
)

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetail,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}
