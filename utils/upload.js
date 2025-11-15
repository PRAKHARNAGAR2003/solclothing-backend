const multer = require("multer");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");

if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

async function uploadToCloudOrLocal(filePath) {
  if (process.env.CLOUDINARY_CLOUD_NAME) {
    const res = await cloudinary.uploader.upload(filePath, { folder: "sol-products" });
    // remove local file
    try { fs.unlinkSync(filePath); } catch (e) {}
    return res.secure_url;
  } else {
    // local url accessible via /uploads/
    return `/uploads/${path.basename(filePath)}`;
  }
}

module.exports = { upload, uploadToCloudOrLocal };
