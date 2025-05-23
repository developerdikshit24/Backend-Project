import { v2 as cloudinary } from "cloudinary"
// cloudinary.uploader.upload
import fs from "fs"
import { extractPublicId } from "cloudinary-build-url"

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})

const uploadOnCloud = async (localFilePath, resource_type) => {
    try {
        if (!localFilePath) return null;

        const response = await cloudinary.uploader.upload(localFilePath,
            {
                transformation: [
                    { quality: "auto", fetch_format: "auto" }
                ]
            },
            {
                resource_type: resource_type
            })
        // fs.unlinkSync(localFilePath)
        // console.log("File Upload on Coudinary Sucessfully", response.url);
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null;
    }
}
// Its Take time to understand 
const deleteFromCloud = async (filePath, resource_type) => {
    try {
        if (!filePath) return null;
        const publicId = extractPublicId(filePath)
        const response = await cloudinary.uploader.destroy(publicId,
            {
                resource_type: resource_type
            }
        )
        return response
    } catch (error) {
        return null;
    }
}

export {
    uploadOnCloud,
    deleteFromCloud,


}