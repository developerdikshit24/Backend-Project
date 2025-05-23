import mongoose, { Schema } from "mongoose";

const likesSchema = new Schema({
    comment: {
        type: Schema.Types.ObjectId,
        ref: "Comment"
    },
    tweet: {
        type: Schema.Types.ObjectId,
        ref: "Tweet"
    },
    video: {
        type: Schema.Types.ObjectId,
        ref: "Video"

    },
    likeBy: {
        type: Schema.Types.ObjectId,
        ref: "User"  
    }
}, { timestamps: true })

export const Like = mongoose.model("Like", likesSchema)