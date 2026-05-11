const asyncHandler = require("../core/asyncHandler");
const { success } = require("../core/apiResponse");
const couponService = require("../services/couponService");

const create = asyncHandler(async (req, res) => {
  const coupon = await couponService.createCoupon(req.body, req.user);
  return success(res, "Coupon created.", { coupon }, 201);
});

const apply = asyncHandler(async (req, res) => {
  const result = await couponService.applyCoupon({ ...req.body, userId: req.user._id });
  return success(res, "Coupon applied.", result);
});

module.exports = { create, apply };
