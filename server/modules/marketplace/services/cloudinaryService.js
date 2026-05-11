const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function toDataUri(file) {
  return `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
}

async function uploadImage(file, folder = "marketplace") {
  if (!file) {
    return "";
  }

  const result = await cloudinary.uploader.upload(toDataUri(file), {
    folder,
    resource_type: "image",
  });

  return result.secure_url;
}

async function uploadImages(files = [], folder = "marketplace/products") {
  return Promise.all(files.map((file) => uploadImage(file, folder)));
}

module.exports = { uploadImage, uploadImages };
