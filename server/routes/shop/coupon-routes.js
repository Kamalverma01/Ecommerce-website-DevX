const express = require("express");
const { createCoupon, applyCoupon } = require("../../controllers/shop/coupon-controller");

const router = express.Router();

// Admin creates a coupon
router.post("/create", createCoupon);

// User applies a coupon
router.post("/apply", applyCoupon);

module.exports = router;