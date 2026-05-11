const mongoose = require("mongoose");

const FraudLogSchema = new mongoose.Schema(
  {
    actorType: { type: String, enum: ["customer", "seller", "system"], required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceUser", default: null },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceSeller", default: null },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceOrder", default: null },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceProduct", default: null },
    type: { type: String, required: true, index: true },
    score: { type: Number, default: 0 },
    severity: { type: String, enum: ["low", "medium", "high", "critical"], default: "low" },
    message: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.MarketplaceFraudLog ||
  mongoose.model("MarketplaceFraudLog", FraudLogSchema, "marketplace_fraud_logs");
