import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema({
    name: {
        type: String,
        require: true,
        trim: true,
        unique: true,
    },
    description: {
        type: String,
        trim: true,
        require:true
    },
    videos: [{
        type: Schema.Types.ObjectId,
        ref: "Video",
        index:true
    }],
    owner: {
        type:Schema.Types.ObjectId,
        ref: "User",
        
    }
}, { timestamps: true })

export const Playlist = mongoose.model("Playlist", playlistSchema)