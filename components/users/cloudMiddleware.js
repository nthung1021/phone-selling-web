const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dvnr2fqlk',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Set up Cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'user_folder',
        allowed_formats: ['jpeg', 'png', 'jpg', 'gif'],
        public_id: (req, file) => file.originalname.split('.')[0],
    },
});

// Set up multer
const upload = multer({ storage });

module.exports = upload;
