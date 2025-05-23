import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweets.module.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const { content } = req.body
    if (!content) throw new ApiError(401, "Data is required")

    const tweet = await Tweet.create({
        owner: new mongoose.Types.ObjectId(req.user?._id),
        content: content
    })

    if (!tweet) throw new ApiError(500, error);

    return res.status(200)
        .json(new ApiResponse(200, tweet, "Create tweet successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    try {
        const loggedUser = req?.user?._id;
        if (!loggedUser) throw new ApiError(400, "Unauthorized User");
        const tweets = await Tweet.find({ owner: new mongoose.Types.ObjectId(loggedUser) });
        if (!tweets) return res.status(200).json(new ApiResponse(200, {}, "No Tweet Yet"))
        return res.status(200)
            .json(new ApiResponse(200, tweets, "Tweet Fetch Successfully"))
    } catch (error) {
        throw new ApiError(500, error);
    }
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    try {
        const { tweetId } = req.params;
        const loggedUser = req.user?._id;
        const { content } = req.body;

        if (!tweetId) throw new ApiError(400, "Tweet Id Not Found");
        if (!content) throw new ApiError(400, "Content not found");
        if (!loggedUser) throw new ApiError(400, "Unauthorized User");

        const updatedTweet = await Tweet.findOneAndUpdate(
            { $and: [{ _id: new mongoose.Types.ObjectId(tweetId) }, { owner: new mongoose.Types.ObjectId(loggedUser) }] },
            { content, updatedAt: Date.now() },
            { new: true }
        )
        if (!updatedTweet) throw new ApiError(400, "Error while updating tweet");
        return res.status(200).json(new ApiResponse(200, updatedTweet, "Tweet Updated Successfully"));
    } catch (error) {
        throw new ApiError(500, error)
    }
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    try {
        const { tweetId } = req.params;
        const loggedUser = req.user?._id;
        if (!loggedUser) throw new ApiError(400, "Unauthorized User");
        if (!tweetId) throw new ApiError(400, "Tweet Id is required");
        const tweetDeleteStatus = await Tweet.findOneAndDelete(
            { $and: [{ _id: tweetId }, { owner: loggedUser }] }
        )
        if (!tweetDeleteStatus) throw new ApiError(404, "Tweet not Found");
        return res.status(200).json(new ApiResponse(200, {}, "Tweet Delete Sucessfully"));

    } catch (error) {
        throw new ApiError(400, error);
    }
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}