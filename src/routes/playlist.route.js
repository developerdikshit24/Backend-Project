import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";

import {
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    removeVideoFromPlaylist,
    addVideoInPlaylist
} from "../controllers/playlist.controller.js"

const router = Router()
router.route("/createplaylist").post(verifyJwt, createPlaylist);
router.route("/updateplaylist/:playlistId").post(verifyJwt, updatePlaylist);
router.route("/deleteplaylist/:playlistId").post(verifyJwt, deletePlaylist);
router.route("/removevideoplaylist").post(verifyJwt, removeVideoFromPlaylist);
router.route("/addvideoinplaylist/:playlistId").post(verifyJwt, addVideoInPlaylist);

export default router