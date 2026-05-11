const mongoose = require("mongoose");

const SellerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    businessType: {
      type: String,
      default: "",
      trim: true,
    },
    supportEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    gstNumber: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
    },
    pickupPincode: {
      type: String,
      default: "",
      trim: true,
    },
    productCategories: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    commissionOverride: {
      type: Number,
      default: null,
    },
    approvedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Seller", SellerSchema);
