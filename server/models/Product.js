const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    sellerName: {
      type: String,
      default: "Platform",
      trim: true,
    },
    businessName: {
      type: String,
      default: "Platform",
      trim: true,
    },
    image: String,
    images: {
      type: [String],
      default: [],
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
      default: "",
    },
    name: {
      type: String,
      trim: true,
      default: "",
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
      default: "",
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    salePrice: {
      type: Number,
      default: 0,
    },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    totalStock: {
      type: Number,
      default: 0,
    },
    sku: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    deliveryInfo: {
      etaDays: {
        type: Number,
        default: 0,
      },
      dispatchFrom: {
        type: String,
        default: "",
        trim: true,
      },
      returnWindowDays: {
        type: Number,
        default: 0,
      },
    },
    averageReview: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    commissionPercent: {
      type: Number,
      default: Number(process.env.GLOBAL_COMMISSION_PERCENTAGE || 10),
    },
    commissionAmount: {
      type: Number,
      default: 0,
    },
    sellerEarning: {
      type: Number,
      default: 0,
    },
    platformProfit: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

ProductSchema.pre("save", function (next) {
  const price = Number(this.price || 0);
  const commissionPercent = Number(this.commissionPercent || process.env.GLOBAL_COMMISSION_PERCENTAGE || 10);
  if (!this.name && this.title) {
    this.name = this.title;
  }
  if (!this.slug && this.title) {
    this.slug = String(this.title)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }
  if (!this.businessName && this.sellerName) {
    this.businessName = this.sellerName;
  }
  this.commissionPercent = commissionPercent;
  this.commissionAmount = Number(((price * commissionPercent) / 100).toFixed(2));
  this.sellerEarning = Number((price - this.commissionAmount).toFixed(2));
  this.platformProfit = Number(this.commissionAmount.toFixed(2));
  next();
});

ProductSchema.index({ category: 1, brand: 1 });
ProductSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Product", ProductSchema);
