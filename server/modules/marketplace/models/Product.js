const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceSeller", required: true, index: true },
    sellerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceUser", required: true },
    sellerBusinessName: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true, index: "text" },
    title: { type: String, trim: true },
    description: { type: String, required: true, trim: true, index: "text" },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceCategory", required: true, index: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceBrand", required: true, index: true },
    images: {
      type: [String],
      validate: {
        validator: (images) => images.length >= 3 && images.length <= 4,
        message: "Product requires 3 to 4 images.",
      },
    },
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, default: 0, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    lowStockThreshold: { type: Number, default: 5 },
    reservedStock: { type: Number, default: 0 },
    commissionRate: { type: Number, default: Number(process.env.GLOBAL_COMMISSION_PERCENTAGE || 10) },
    status: { type: String, enum: ["draft", "active", "inactive", "flagged"], default: "draft" },
    fakeProductFlags: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    popularityScore: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ProductSchema.index({ name: "text", description: "text" });
ProductSchema.index({ price: 1, category: 1, averageRating: -1 });

module.exports =
  mongoose.models.MarketplaceProduct ||
  mongoose.model("MarketplaceProduct", ProductSchema, "marketplace_products");
