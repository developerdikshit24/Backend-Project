import mongoose from "mongoose"
import { Comment } from "../models/comments.module.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { Video } from "../models/video.models.js"
import { timeStamp } from "console"


const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        customLabels: {
            totalDocs: "total_comments",
            docs: "Comments"
        }
    }

    const getAllVideo = await Comment.aggregatePaginate([
        {
            $match: { video: new mongoose.Types.ObjectId(videoId) }

        },
        {
            $sort: { createdAt: -1 }
        }
    ], options)


    if (!getAllVideo) {
        throw new ApiError(500, "Something went wrong while fetching comment")
    }

    return res.status(200)
        .json(new ApiResponse(200, getAllVideo, "Comments fetch successfully"))

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params
    if (!videoId) {
        throw new ApiError(401, "Video Id Is Required")
    }

    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "Video Not Found")
    }

    const { content } = req.body

    if (!content) {
        throw new ApiError(401, "Comment is Required")
    }
    const addComments = await Comment.create({
        content,
        video: new mongoose.Types.ObjectId(video?._id),
        owner: new mongoose.Types.ObjectId(req.user._id)
    })

    if (!addComments) {
        throw new ApiError(500, "Something went wrong while adding comment")
    }

    return res.status(200)
        .json(new ApiResponse(200, { addComments }, "Comment Add Successfully"))

}
)


const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const{ commentId }= req.params
    const { content } = req.body
    if (!content) throw new ApiError(401, "Comment is Required")

    const comment = await Comment.findOne({
        _id: new mongoose.Types.ObjectId(commentId),
        owner: new mongoose.Types.ObjectId(req.user?._id)
    })
    if (!comment) throw new ApiError(401, "Comment Not Found")
    comment.content = content
    await comment.save()

    return res.status(200)
        .json(new ApiResponse(200, {comment}, "Comment Update SuccessFully"))

})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const delComment = await Comment.deleteOne({
        $and: [{ _id: commentId },{ owner: req.user._id }] 
    })
  
    if(delComment.deletedCount === 0) throw new ApiError(500, "Something Went wrong while deleting video")

    return res.status(200)
    .json(new ApiResponse(200, {}, "Comment Delete Successfully"))
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}
