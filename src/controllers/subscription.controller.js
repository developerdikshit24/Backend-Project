import { Subscription } from '../models/subscription.module.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

const subscribeToggle = asyncHandler(async (req, res) => {
    try {
        const { userId } = req.params;
        const loggedUser = req.user?._id;
        if (!userId) throw new ApiError(400, "userId is required");
        if (!loggedUser) throw new ApiError(400, "Unauthorized User");

        const SubsribedUser = await Subscription.findOne({ $and: [{ subscriber: loggedUser }, { channel: userId }] })
        if (SubsribedUser) {
            await Subscription.findByIdAndDelete(SubsribedUser?._id);
            return res.status(200).json(new ApiResponse(200, "Unsubscribed Successfully"));
        }

        const newSubscribe = await Subscription.create({
            subscriber: loggedUser,
            channel: userId,
        })
        if (!newSubscribe) throw new ApiError(400, "Error While Subscribe New Channel");
        return res.status(200).json(new ApiResponse(200, newSubscribe, "Subscried Sucessfully"));
    } catch (error) {
        throw new ApiError(500, "Something went wrong while Subscribe or Unsubscribe channel");
    }


})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    try {
        const loggedUser = req.user?._id;
        const subscribedChannel = await Subscription.aggregate([
            {
                $match: {
                    subscriber: loggedUser
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "channel",
                    foreignField: "_id",
                    as: "subscribedChannels"

                }
            },
            {
                $addFields: {
                    subscribeChannels: "$subscribedChannels"

                }
            },
            {
                $project: {
                    subscribeChannels: {
                        _id: 1,
                        userName: 1,
                        email: 1,
                        fullName: 1,
                        avatar: 1,
                        coverImage: 1,
                        watchHistory: 1,
                    }
                }
            }
        ])

        if (!subscribedChannel) throw new ApiError(400, "Error in Fetch Subscribed Channels");

        return res.status(200)
            .json(new ApiResponse(200, subscribedChannel, "Channel Fetch Successfully"));
    } catch (error) {
        throw new ApiError(400, error);
    }
})



export {
    subscribeToggle,
    getSubscribedChannels
}