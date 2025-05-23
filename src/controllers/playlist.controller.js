import { Playlist } from "../models/playlist.model.js";
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import mongoose from "mongoose";


const createPlaylist = asyncHandler(async (req, res) => {
    try {
        const loggedUser = req.user?._id;
        const { name, description, video } = req.body;
        if ([name, description, video].some((field) => field?.trim() == "")) throw new ApiError(400, "All Fields required");
        if (!loggedUser) throw new ApiError(400, "unauthorized User");
        const checkPlaylist = await Playlist.findOne({ name: name });
        if (checkPlaylist) throw new ApiError(402, "Playlist already Exist");
        const newPlaylist = await Playlist.create({
            name,
            description,
            videos: new mongoose.Types.ObjectId(video),
            owner: loggedUser
        })
        if (!newPlaylist) throw new ApiError(400, "Error while creating New Playlist");

        return res.status(200).json(new ApiResponse(200, newPlaylist, "Playlist Create Sucessfully"));

    } catch (error) {
        throw new ApiError(406, error);
    }
})

const updatePlaylist = asyncHandler(async (req, res) => {
    try {
        const loggedUser = req.user?._id;
        const { playlistId } = req.params;
        const { name, description } = req.body;
        if ([name, description].some((field) => field?.trim() == "")) throw new ApiError(400, "All Fields required");
        if (!playlistId) throw new ApiError(400, "Playlist id required");
        if (!loggedUser) throw new ApiError(400, "unauthorized User");
        const updatedPlaylist = await Playlist.findByIdAndUpdate(
            { _id: new mongoose.Types.ObjectId(playlistId) },
            {
                name,
                description
            },
            { new: true }
        )
        return res.status(200).json(new ApiResponse(200, updatedPlaylist, "Plalist Update Successfully"))
    } catch (error) {
        throw new ApiError(500, error);

    }
})

const addVideoInPlaylist = asyncHandler(async (req, res) => {
    try {
        const { videoId } = req.body;
        const { playlistId } = req.params;
        const loggedUser = req.user?._id;
        if (!playlistId) throw new ApiError(400, "Playlist id required");
        if (!loggedUser) throw new ApiError(400, "unauthorized User");
        if (!videoId) throw new ApiError(400, "Video id is required");

        const playlist = await Playlist.findById(playlistId);
        if (!playlist) throw new ApiError(404, "Playlist not found");
        if (playlist.owner.toString() !== loggedUser.toString()) throw new ApiError(401, "unAuthorized user");
        if (playlist.videos.includes(videoId)) throw new ApiError(409, "Video already exists in the playlist.");

        playlist.videos.push(videoId);
        await playlist.save();

        return res.status(200).json(new ApiResponse(200, playlist, "Video Added Successfully"));
    } catch (error) {
        throw new ApiError(500, error);

    }
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    try {
        const { videoId, playlistId } = req.body;
        const loggedUser = req.user?._id;
        if (!videoId || !playlistId) throw new ApiError(404, "VideoId and PlaylistId is required");

        const playlist = await Playlist.findById(playlistId);

        const initialPlaylistLength = playlist.videos.length;

        if (playlist.owner.toString() !== loggedUser.toString()) throw new ApiError(401, "unAuthorized user");

        playlist.videos = playlist.videos.filter(video => video.toString() !== videoId);
        if (playlist.videos.length === initialPlaylistLength) {
            throw new ApiError(401, "Video not found")
        }

        await playlist.save({ validateBeforeSave: false });

        return res.status(200).json(new ApiResponse(200, playlist, "video removed successfully"));
    } catch (error) {
        throw new ApiError(500, error);
    }
})

const deletePlaylist = asyncHandler(async (req, res) => {
    try {
        const loggedUser  = req.user?._id;
        const { playlistId } = req.params;
        if (!loggedUser) throw new ApiError(401, "unAuthorized user");
        if (!playlistId) throw new ApiError(401, "Playlist Id is required");

        const deletedPlaylistStatus = await Playlist.findOneAndDelete({ $and: [{ _id: new mongoose.Types.ObjectId(playlistId) }, { owner: new mongoose.Types.ObjectId(loggedUser) }] })
        if (!deletedPlaylistStatus) throw new ApiError(404, "Video not found in the playlist")
        return res.status(200).json(new ApiResponse(200, {}, "Playlist delete successfully"))
    } catch (error) {
        throw new ApiError(404, error);
    }
})

export {
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    removeVideoFromPlaylist,
    addVideoInPlaylist
}