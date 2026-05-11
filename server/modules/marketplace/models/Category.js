const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceUser" },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.MarketplaceCategory ||
  mongoose.model("MarketplaceCategory", CategorySchema, "marketplace_categories");
