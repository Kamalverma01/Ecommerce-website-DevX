const express = require("express");
const {
  applySeller,
  getMyApplication,
  getSellerProducts,
  uploadSellerProductImages,
  uploadSellerBrandLogo,
  getSellerBrands,
  createSellerBrand,
  requestSellerCategory,
  addSellerProduct,
  editSellerProduct,
  deleteSellerProduct,
  getSellerOrders,
  updateSellerOrderStatus,
  getSellerDashboard,
} = require("../../controllers/seller/seller-controller");
const { authMiddleware, requireSeller } = require("../../controllers/auth/auth-controller");
const { upload } = require("../../helpers/cloudinary");

const router = express.Router();

router.post("/apply", authMiddleware, applySeller);
router.get("/application", authMiddleware, getMyApplication);
router.get("/dashboard", authMiddleware, requireSeller, getSellerDashboard);
router.post("/category-requests", authMiddleware, requireSeller, requestSellerCategory);
router.get("/brands", authMiddleware, requireSeller, getSellerBrands);
router.post("/brands", authMiddleware, requireSeller, createSellerBrand);
router.post("/brands/upload-logo", authMiddleware, requireSeller, upload.single("my_file"), uploadSellerBrandLogo);
router.post("/products/upload-images", authMiddleware, requireSeller, upload.array("images", 4), uploadSellerProductImages);
router.get("/products", authMiddleware, requireSeller, getSellerProducts);
router.get("/product", authMiddleware, requireSeller, getSellerProducts);
router.post("/products", authMiddleware, requireSeller, addSellerProduct);
router.post("/product", authMiddleware, requireSeller, addSellerProduct);
router.put("/products/:id", authMiddleware, requireSeller, editSellerProduct);
router.put("/product/:id", authMiddleware, requireSeller, editSellerProduct);
router.delete("/products/:id", authMiddleware, requireSeller, deleteSellerProduct);
router.delete("/product/:id", authMiddleware, requireSeller, deleteSellerProduct);
router.get("/orders", authMiddleware, requireSeller, getSellerOrders);
router.put("/orders/:orderId/status", authMiddleware, requireSeller, updateSellerOrderStatus);
router.put("/order/:orderId/status", authMiddleware, requireSeller, updateSellerOrderStatus);

module.exports = router;
