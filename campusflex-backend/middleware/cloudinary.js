const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for posts (images + videos)
const postStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: `campusflex/posts/${req.user.campus}`,
    resource_type: file.mimetype.startsWith("video") ? "video" : "image",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "mp4", "mov"],
    transformation: file.mimetype.startsWith("video")
      ? [{ quality: "auto" }]
      : [{ quality: "auto", fetch_format: "auto" }],
  }),
});

// Storage for profile pictures
const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "campusflex/avatars",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 400, height: 400, crop: "fill" }],
  },
});

// Storage for stories
const storyStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: `campusflex/stories/${req.user.campus}`,
    resource_type: file.mimetype.startsWith("video") ? "video" : "image",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "mp4", "mov"],
  }),
});

const uploadPost   = multer({ storage: postStorage });
const uploadAvatar = multer({ storage: avatarStorage });
const uploadStory  = multer({ storage: storyStorage });

module.exports = { cloudinary, uploadPost, uploadAvatar, uploadStory };