import { Router } from "express"
import { upload } from "../middlewares/multer.middleware.js"
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetail,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
} from "../controllers/user.controller.js"
import { verifyJwt } from "../middlewares/auth.middleware.js"

const router = Router()

router.route("/register").post(
   /*Middleware which is use to upload files*/  upload.fields([
    {
        name: "avatar",
        maxCount: 1
    },
    {
        name: "coverImage",
        maxCount: 1
    }
]),
    registerUser
);
router.route("/login").post(loginUser)
router.route("/logout").post(verifyJwt, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-Password").post(verifyJwt, changeCurrentPassword)
router.route("/get-User").get(verifyJwt, getCurrentUser)
router.route("/update-Detail").patch(verifyJwt, updateAccountDetail)
router.route("/change-avatar").patch(verifyJwt, upload.single("avatar"), updateUserAvatar)
router.route("/change-coverImage").patch(verifyJwt, upload.single('coverImage'), updateUserCoverImage)
router.route("/c/:username").get(getUserChannelProfile)
router.route("/History").get(verifyJwt, getWatchHistory)
export default router