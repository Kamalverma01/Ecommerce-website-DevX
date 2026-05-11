const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceUser", required: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceProduct", required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceOrder", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: "", trim: true },
    comment: { type: String, required: true, trim: true },
    isVerifiedBuyer: { type: Boolean, default: true },
    spamScore: { type: Number, default: 0 },
    status: { type: String, enum: ["published", "under_review", "rejected"], default: "published" },
  },
  { timestamps: true }
);

ReviewSchema.index({ userId: 1, productId: 1, orderId: 1 }, { unique: true });

module.exports =
  mongoose.models.MarketplaceReview || mongoose.model("MarketplaceReview", ReviewSchema, "marketplace_reviews");
