const express = require("express");

const {
  uploadBrandLogo,
  createBrand,
  getBrands,
  updateBrand,
  deleteBrand,
} = require("../../controllers/catalog/brand-controller");
const { authMiddleware, requireAdmin } = require("../../controllers/auth/auth-controller");
const { upload } = require("../../helpers/cloudinary");

const router = express.Router();

router.get("/", getBrands);
router.post("/", authMiddleware, requireAdmin, createBrand);
router.post("/upload-logo", authMiddleware, requireAdmin, upload.single("my_file"), uploadBrandLogo);
router.put("/:id", authMiddleware, requireAdmin, updateBrand);
router.delete("/:id", authMiddleware, requireAdmin, deleteBrand);

module.exports = router;
