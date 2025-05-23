import mongoose, { isValidObjectId } from "mongoose"
import { Like } from "../models/likes.module.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if (!isValidObjectId(videoId)) throw new ApiError(401, "Video is not found")
    const videoLike = await Like.findOne({
        $and: [{ video: videoId }, { likeBy: req.user?._id }]
    })
    if (videoLike) {
        const removeLike = await Like.findByIdAndDelete(videoLike._id)
        return res.status(200)
            .json(new ApiResponse(200, removeLike, "Like Remove on Video successfully"))
    }

    const addLike = await Like.create({
        video: new mongoose.Types.ObjectId(videoId),
        likeBy: new mongoose.Types.ObjectId(req.user?._id)
    })
    if (!addLike) throw new ApiError(500, "Something went wrong while adding like on video")

    return res.status(200)
        .json(new ApiResponse(200, addLike, "Like Add on Video successfully"))

})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    if (!isValidObjectId(commentId)) throw new ApiError(401, "Invaild comment Id")

    const commentLike = await Like.findOne({
        $and: [{ comment: commentId }, { likeBy: req.user?._id }]
    })

    if (commentLike) {
        const removeLike = await Like.findByIdAndDelete(commentLike._id)
        return res.status(200)
            .json(new ApiResponse(200, removeLike, "Like remove on comment is sucessfully"))
    }

    const addLike = await Like.create({
        comment: new mongoose.Types.ObjectId(commentId),
        likeBy: new mongoose.Types.ObjectId(req.user?._id)
    })
    if (!addLike) throw new ApiError(500, "Something went wrong while adding like")

    return res.status(200)
        .json(new ApiResponse(200, addLike, "Like Add on comment successfully"))
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params

    if (!isValidObjectId(tweetId)) throw new ApiError(401, "Invaild tweet id")
    const likeTweet = await Like.findOne({
        $and: [{ tweet: tweetId }, { likeBy: req.user?._id }]
    })

    if (likeTweet) {
        const removeLike = await Like.findByIdAndDelete(likeTweet._id)
        if (!removeLike) throw new ApiError(500, "Something went wrong while removing like")
        return res.status(200)
            .json(new ApiResponse(200, {}, "Like remove on tweet successfully"))
    }
    
    const addLike = await Like.create({
        tweet: new mongoose.Types.ObjectId(tweetId),
        likeBy: new mongoose.Types.ObjectId(req.user?._id)
    })

    if (!addLike) throw new ApiError(500, "Something went wrong while adding like")
    
    return res.status(200)
    .json(new ApiResponse(200, addLike, "LIke add on tweet successfully"))
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const likeVideo = await Like.find({
        $and: [{ likeBy: req.user?._id }, { video: { $exists: true } }]
    })
    
    if (!likeVideo) throw new ApiError(500, "SomeThing went wrong while Fetching Like video or Video Not Found")
    
    return res.status(200)
    .json(new ApiResponse(200,{"Total Video : " :likeVideo.length, "Video":likeVideo }, "Like Video Fetch successfully"))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}