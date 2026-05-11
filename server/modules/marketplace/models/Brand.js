const mongoose = require("mongoose");

const BrandSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceSeller", required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    logo: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

BrandSchema.index({ sellerId: 1, slug: 1 }, { unique: true });

module.exports =
  mongoose.models.MarketplaceBrand || mongoose.model("MarketplaceBrand", BrandSchema, "marketplace_brands");
