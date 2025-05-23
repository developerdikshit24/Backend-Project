import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet

} from "../controllers/tweet.controller.js";

const router = Router()

router.route("/createTweet").post(verifyJwt, createTweet)
router.route("/getusertweets").post(verifyJwt, getUserTweets)
router.route("/updatetweet/:tweetId").get(verifyJwt, updateTweet)
router.route("/deletetweet/:tweetId").get(verifyJwt, deleteTweet)

export default router