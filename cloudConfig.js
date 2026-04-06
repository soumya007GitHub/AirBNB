require("dotenv").config();

const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

const cloudName = process.env.CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUD_API_KEY || process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUD_API_SECRET || process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
});

if (!cloudName || !apiKey || !apiSecret) {
    console.warn(
        "[cloudConfig] Cloudinary env missing. Set CLOUD_NAME, CLOUD_API_KEY, and CLOUD_API_SECRET in .env"
    );
}

const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "airbnb_DEV",
        allowed_formats: ["png", "jpg", "jpeg", "webp"],
    },
});

module.exports = {
    cloudinary,
    storage,
};
