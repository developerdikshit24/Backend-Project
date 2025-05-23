import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from '../utils/ApiError.js'
import { Video } from '../models/video.models.js'
import {
    uploadOnCloud,
    deleteFromCloud
} from "../utils/cloudnary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import mongoose from "mongoose"

const getAllVideo = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query = "", sortBy = "createdAt", sortType = 1, userId = "" } = req.query
    let pipeline = [
        {
            $match: {
                $and: [
                    {
                        $or: [
                            { title: { $regex: query, $options: "i" } },
                            { description: { $regex: query, $options: "i" } }
                        ]
                    },
                    (userId ? [{ Owner: new mongoose.Types.ObjectId(userId) }] : "")

                ]
            }
        },

        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "Owner",
                pipeline: [
                    {
                        $project: {
                            _id: 1,
                            fullName: 1,
                            avatar: "$avatar.url",
                            username: 1,
                        }
                    }
                ]
            }
        },
        {

            $addFields: {
                Owner: {
                    $first: "$owner",
                },
            },
        },
        {
            $sort: { [sortBy]: sortType }
        }
    ];

    try {

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            customLabels: {
                totalDocs: "totalVideos",
                docs: "videos",
            },
        };

        const result = await Video.aggregatePaginate(Video.aggregate(pipeline), options);

        if (result?.videos?.length === 0) {
            return res.status(404).json(new ApiResponse(404, {}, "No Videos Found"));
        }


        return res.status(200).json(new ApiResponse(200, result, "Videos fetched successfully"));

    } catch (error) {
        console.error(error.message);
        return res
            .status(500)
            .json(new ApiError(500, {}, "Internal server error in video aggregation"));
    }
});

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    if ([title, description].some((field) => field?.trim() == "")) {
        throw new ApiError(400, "Title and Description is required")
    }
    const videoLocalPath = req.files?.videofile[0].path
    if (!videoLocalPath) {
        throw new ApiError(400, "Video is not found")
    }
    const thumbnailLocalPath = req.files?.thumbnail[0].path
    if (!thumbnailLocalPath) {
        throw new ApiError(401, "Thumbnail is not found")
    }
    const video = await uploadOnCloud(videoLocalPath, "video")
    const thumbnail = await uploadOnCloud(thumbnailLocalPath, "image")

    if (!video || !thumbnail) {
        throw new ApiError(500, "Something went wrong while uploading Video or thumbnail")
    }

    const videos = await Video.create({
        title,
        description,
        videofile: video.secure_url,
        thumbnail: thumbnail.secure_url,
        duration: video.duration,
        views: 12,
        owner: new mongoose.Types.ObjectId(req.user._id),
        isPublished: true
    })

    const uplodedVideo = Video.findById(videos._id)

    if (!uplodedVideo) {
        throw new ApiError(401, "Something went wrong While uploading the video")
    }

    return res.status(200).json(new ApiResponse(200, videos, "Video Uploaded SuccessFully"))

}
)

const getVideoById = asyncHandler(async (req, res) => {
    const { id } = req.params /*Always remeber that in the request.params are require to get value
    // console.log(id);        then the variable name in the object is same in the params*/


    const video = await Video.findById(id)
    if (!video) {
        throw new ApiError(404, "Video Not Found")
    }
    return res.status(200).json(
        new ApiResponse(200, video, "Video Fetch Sucessfully")
    )
}
)

const updateVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body
    console.log(title, description);

    if ([title, description].some((field) => field?.trim() == "")) {
        throw new ApiError(400, "Title or description required")
    }
    const thumbnail = req.files?.thumbnail[0].path;

    if (!thumbnail) {
        throw new ApiError(401, "Thumbnail is required")
    }

    const { id } = req.params;

    const videoId = await Video.findOne({
        _id: id,
        owner: req.user?._id
    })

    if (!videoId) {
        throw new ApiError(401, "Video Not Found")
    }

    const oldthumbnail = videoId.thumbnail
    const removeOldThumbnail = await deleteFromCloud(oldthumbnail, "image")
    // console.log(removeOldThumbnail);


    if (!removeOldThumbnail) {
        throw new ApiError(400, "thumbnail not removed on cloud")
    }


    const newthumbnail = await uploadOnCloud(thumbnail, "image")
    if (!newthumbnail) {
        throw new ApiError(401, "thumbnail not found")
    }

    const updatedVideo = await Video.findByIdAndUpdate(id,
        {
            $set: {
                title: title,
                thumbnail: newthumbnail.url,
                description: description
            }

        }, { new: true }
    )
    if (!updatedVideo) {
        throw new ApiError(500, "Something went wrong while Update Video")
    }

    return res.status(200)
        .json(
            new ApiResponse(200, { updatedVideo }, "Video Update Successfully...")
        )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!(id)) {
        throw new ApiError(404, "Video not found")
    }
    const videoId = await Video.findOne({
        _id: id,
        owner: req.user?._id
    })

    if (!videoId) {
        throw new ApiError(401, "Video not found")
    }

    const thumbnailUrl = await videoId.thumbnail
    const deletingThumbnailFromCloud = await deleteFromCloud(thumbnailUrl, "image")
    // console.log(deletingThumbnailFromCloud);

    if (!deletingThumbnailFromCloud) {
        throw new ApiError(500, 'Something went wrong while deleting thumbnail from cloud')
    }

    const videoUrl = await videoId.videofile
    const deletingVideoFromCloud = await deleteFromCloud(videoUrl, "video")
    // console.log(deletingVideoFromCloud);

    if (!deletingVideoFromCloud) {
        throw new ApiError(500, 'Something went wrong while deleting video from cloud')
    }


    const deletingOnDatabase = await Video.findByIdAndDelete(id)
    if (!deletingOnDatabase) {
        throw new ApiError(500, "Something went wronh while deleting video from database")
    }
    return res.status(200)
        .json(
            new ApiResponse(200, {}, "Video Delete Sucessfully")
        )

}
)

const togglePublishedStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const videoId = await Video.findOne({
        _id: id,
        owner: req.user?._id
    })

    if (!videoId) {
        throw new ApiError(404, "Video not found")
    }

    if (videoId.isPublished) {
        videoId.isPublished = false
        videoId.save()
        return res.status(200).json(new ApiResponse(200, videoId.isPublished, "Video unPublished successfully"))
    } else {
        videoId.isPublished = true
        videoId.save()
        return res.status(200).json(new ApiResponse(200, videoId.isPublished, "Video Published successfully"))
    }
}
)

export {
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishedStatus,
    getAllVideo

}