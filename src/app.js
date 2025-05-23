import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors'
const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(express.json({ limit: "20kb" }))
app.use(express.urlencoded({ extended: true, limit: "20kb" }))
app.use(express.static("public/images"))
app.use(cookieParser())

// routes
import userRouter from "./routes/user.routes.js"
import videoRouter from "./routes/video.routes.js"
import Comment from './routes/comments.route.js'
import Like from './routes/like.route.js'
import Tweet from './routes/tweet.route.js'
import Playlist from './routes/playlist.route.js';
import  Subscription  from './routes/subscription.route.js';
// routes decelaration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/videos/comments", Comment)
app.use("/api/v1/videos/likes", Like)
app.use("/api/v1/tweets", Tweet)
app.use("/api/v1/playlists", Playlist)
app.use("/api/v1/subscriptions", Subscription)
export { app }