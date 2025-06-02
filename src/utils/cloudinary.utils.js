import { v2 as cloudinary } from 'cloudinary';
import { ApiError } from './apiError.utils.js';


cloudinary.config({
    cloud_name: 'db5dcrh09',
    api_key: '881541497963323',
    api_secret: '-8yqwOac4YJqgKBG3YUsQoeYSF4'
});



const uploadOnCloudinary = async (fileContent) => {
    try {
        const uploadResponse = await cloudinary.uploader.upload(fileContent, { resource_type: 'auto' });
        return uploadResponse;
    } catch (error) {
        console.error('Error while Uploading to Cloudinary', error);
        throw new ApiError(500, "Internal Server Error");
    }
};

const deleteFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        if (result.result === 'ok') {
            return result;
        } else {
            throw new ApiError(400, 'Error deleting from Cloudinary');
        }
    } catch (error) {
        console.log('Cloudinary deletion error', error.message || error);
        throw new ApiError(400, 'Error while deleting from Cloudinary');
    }
};


export {
    uploadOnCloudinary,
    deleteFromCloudinary
};
