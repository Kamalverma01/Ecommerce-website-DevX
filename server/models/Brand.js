const mongoose = require("mongoose");

const BrandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Brand name is required"],
      trim: true,
      minlength: [2, "Brand name must be at least 2 characters"],
      maxlength: [80, "Brand name cannot exceed 80 characters"],
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    logo: {
      type: String,
      trim: true,
      default: "",
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    sellerBusinessName: {
      type: String,
      default: "",
      trim: true,
    },
    ownerRole: {
      type: String,
      enum: ["admin", "seller"],
      default: "admin",
    },
  },
  { timestamps: true }
);

BrandSchema.index({ name: 1 });

module.exports = mongoose.model("Brand", BrandSchema);
