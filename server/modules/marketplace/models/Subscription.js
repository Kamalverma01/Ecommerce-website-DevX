const mongoose = require("mongoose");

const SubscriptionSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceSeller", required: true, unique: true },
    plan: { type: String, enum: ["basic", "pro", "premium"], default: "basic" },
    productLimit: { type: Number, default: 50 },
    commissionReduction: { type: Number, default: 0 },
    startsAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },
    status: { type: String, enum: ["active", "expired", "cancelled"], default: "active" },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.MarketplaceSubscription ||
  mongoose.model("MarketplaceSubscription", SubscriptionSchema, "marketplace_subscriptions");
