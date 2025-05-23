import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
    toggleVideoLike,
    toggleCommentLike,
    getLikedVideos
} from "../controllers/like.controller.js"

const router = Router()

router.route("/likeVideo/:videoId").post(verifyJwt, toggleVideoLike)
router.route("/likeComment/:commentId").post(verifyJwt, toggleCommentLike)
router.route("/getLikedVideos").get(verifyJwt, getLikedVideos)

export default router