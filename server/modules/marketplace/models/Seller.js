const mongoose = require("mongoose");

const SellerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceUser", required: true, unique: true },
    businessName: { type: String, required: true, trim: true },
    businessType: { type: String, default: "", trim: true },
    supportEmail: { type: String, default: "", lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    kyc: {
      panNumber: { type: String, required: true, uppercase: true, trim: true },
      gstNumber: { type: String, default: "", uppercase: true, trim: true },
      bankAccountNumber: { type: String, required: true, trim: true },
      ifscCode: { type: String, required: true, uppercase: true, trim: true },
      accountHolderName: { type: String, required: true, trim: true },
      documents: [{ type: String }],
    },
    status: { type: String, enum: ["pending", "approved", "rejected", "suspended"], default: "pending" },
    verifiedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    notes: { type: String, default: "" },
    commissionOverride: { type: Number, default: null },
    walletFrozen: { type: Boolean, default: false },
    subscriptionPlan: {
      type: String,
      enum: ["basic", "pro", "premium"],
      default: "basic",
    },
    analytics: {
      returnRate: { type: Number, default: 0 },
      fraudFlags: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.MarketplaceSeller || mongoose.model("MarketplaceSeller", SellerSchema, "marketplace_sellers");
