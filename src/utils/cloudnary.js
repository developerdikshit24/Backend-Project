import { v2 as cloudinary } from "cloudinary"
import { error } from "console"
// cloudinary.v2.uploader.upload
import fs from "fs/promises"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloud = async(localFilePath) => {
    try {
        if (!localFilePath) return null;
        
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type : "auto"
        })
        console.log("File Upload on Coudinary Sucessfully", response.url);
        return response;
        
        
    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null; 
    }
}

export{uploadOnCloud}