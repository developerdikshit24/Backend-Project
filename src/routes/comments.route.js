import { Router } from "express";
import {
    addComment,
    getVideoComments,
    updateComment,
    deleteComment
 } from "../controllers/comment.controller.js"
import { verifyJwt } from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/addComment/:videoId").post(verifyJwt, addComment)
router.route("/getVideoComments/:videoId").get(getVideoComments)
router.route("/updateComment/:commentId").patch(verifyJwt, updateComment)
router.route("/deleteComment/:commentId").delete(verifyJwt, deleteComment)

export default router