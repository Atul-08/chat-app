const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for profile pictures
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'chatapp/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'fill' }],
  },
});

// Storage for chat images
const messageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'chatapp/messages',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  },
});

const uploadProfile = multer({ storage: profileStorage });
const uploadMessage = multer({ storage: messageStorage });

// Fallback upload to base64 if Cloudinary is not configured
const uploadToCloudinary = async (base64Image, folder = 'chatapp') => {
  if (!process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME === 'your_cloud_name') {
    // Return placeholder if Cloudinary not configured
    return null;
  }
  const result = await cloudinary.uploader.upload(base64Image, { folder });
  return result.secure_url;
};

module.exports = { cloudinary, uploadProfile, uploadMessage, uploadToCloudinary };
