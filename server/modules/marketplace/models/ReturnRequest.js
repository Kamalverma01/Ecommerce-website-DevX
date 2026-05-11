const mongoose = require("mongoose");

const ReturnRequestSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceOrder", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceUser", required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceSeller", required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: ["requested", "approved", "rejected", "refunded"], default: "requested" },
    refundReference: { type: String, default: "" },
    adminNote: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.MarketplaceReturnRequest ||
  mongoose.model("MarketplaceReturnRequest", ReturnRequestSchema, "marketplace_return_requests");
