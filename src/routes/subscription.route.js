import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
    subscribeToggle,
    getSubscribedChannels
} from '../controllers/subscription.controller.js'

const router = Router()

router.route("/subscribeToggle/:userId").post(verifyJwt, subscribeToggle);
router.route("/getsubscribedchannels").get(verifyJwt, getSubscribedChannels);

export default router