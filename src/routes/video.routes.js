import { Router } from "express";
import {
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishedStatus,
    getAllVideo
 } from "../controllers/video.controller.js"
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJwt } from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/publishVideo").post(verifyJwt, upload.fields([
    {
        name: "videofile",
        maxCount: 1,
        
    },
    {
        name: "thumbnail",
        maxCount:1
    }
]), publishAVideo)

router.route("/url/:id").get(getVideoById)
router.route("/updateVideo/url/:id").patch(verifyJwt, upload.fields([
    {
        name: "thumbnail",
        maxCount: 1
    }
]) , updateVideo)

router.route("/deleteVideo/url/:id").delete(verifyJwt, deleteVideo)
router.route("/publishStatus/:id").get(verifyJwt, togglePublishedStatus)
router.route("/getAllVideo").get(verifyJwt, getAllVideo)
export default router 