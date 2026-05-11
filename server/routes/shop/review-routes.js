const express = require("express");

const {
  addProductReview,
  getProductReviews,
  getAllProductReviews,
  getSellerProductReviews,
} = require("../../controllers/shop/product-review-controller");
const { authMiddleware, requireAdmin, requireSeller } = require("../../controllers/auth/auth-controller");

const router = express.Router();

router.post("/add", authMiddleware, addProductReview);
router.get("/admin/all", authMiddleware, requireAdmin, getAllProductReviews);
router.get("/seller/all", authMiddleware, requireSeller, getSellerProductReviews);
router.get("/:productId", getProductReviews);

module.exports = router;
