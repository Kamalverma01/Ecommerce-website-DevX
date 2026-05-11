const mongoose = require("mongoose");

const CouponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    ownerType: { type: String, enum: ["admin", "seller"], default: "admin" },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceSeller", default: null },
    discountType: { type: String, enum: ["percentage", "flat"], required: true },
    value: { type: Number, required: true, min: 0 },
    maxDiscount: { type: Number, default: 0 },
    minOrderValue: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
    usageLimit: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },
    usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceUser" }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.MarketplaceCoupon || mongoose.model("MarketplaceCoupon", CouponSchema, "marketplace_coupons");
