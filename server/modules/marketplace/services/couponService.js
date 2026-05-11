const Coupon = require("../models/Coupon");

async function createCoupon(payload, owner) {
  return Coupon.create({
    ...payload,
    code: String(payload.code).toUpperCase(),
    ownerType: owner.role === "seller" ? "seller" : "admin",
    sellerId: owner.sellerId || null,
  });
}

async function applyCoupon({ code, userId, total }) {
  const coupon = await Coupon.findOne({
    code: String(code).toUpperCase(),
    isActive: true,
    expiresAt: { $gt: new Date() },
  });

  if (!coupon || coupon.usedCount >= coupon.usageLimit || coupon.usedBy.includes(userId)) {
    throw new Error("Coupon is invalid or exhausted.");
  }

  if (total < coupon.minOrderValue) {
    throw new Error("Order total does not meet coupon minimum.");
  }

  const rawDiscount =
    coupon.discountType === "percentage" ? (total * coupon.value) / 100 : coupon.value;
  const discount = coupon.maxDiscount ? Math.min(rawDiscount, coupon.maxDiscount) : rawDiscount;

  return { coupon, discount: Number(discount.toFixed(2)) };
}

module.exports = { createCoupon, applyCoupon };
