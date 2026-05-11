const mongoose = require("mongoose");

const CategoryRequestSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceSeller", required: true },
    name: { type: String, required: true, trim: true },
    reason: { type: String, default: "" },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    adminNote: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.MarketplaceCategoryRequest ||
  mongoose.model("MarketplaceCategoryRequest", CategoryRequestSchema, "marketplace_category_requests");
