const multer = require("multer");

const storage = multer.memoryStorage();

const uploadProductImages = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 4 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image uploads are allowed."));
      return;
    }

    cb(null, true);
  },
}).array("images", 4);

const uploadBrandLogo = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
}).single("logo");

module.exports = { uploadProductImages, uploadBrandLogo };
