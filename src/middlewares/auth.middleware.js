import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.models.js";

export const verifyJwt = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || /* If User send data via Mobile*/req.header("Authorization")?.replace("Bearer ", "")
        // console.log(token);

        if (!token) {
            throw new ApiError(400, "Unauthorized Request")
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET) 
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
        // console.log(user);
        
        if (!user) {
            throw new ApiError(401, "Invaild Access Token")
        }
        // At That moment i think req.user it can be return but it is not it is just assign data
        req.user = user;
        
        next();
            // console.log(user);
            

    } catch (error) {
        throw new ApiError(401, "Invaild Access Token")

    }
})

