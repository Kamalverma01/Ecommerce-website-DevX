const mongoose = require("mongoose");

const OtpVerificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceUser", default: null },
    channel: { type: String, enum: ["email", "sms"], required: true },
    target: { type: String, required: true, trim: true },
    purpose: { type: String, enum: ["auth", "cod", "delivery"], required: true },
    otpHash: { type: String, required: true, select: false },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    verifiedAt: { type: Date, default: null },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.MarketplaceOtpVerification ||
  mongoose.model("MarketplaceOtpVerification", OtpVerificationSchema, "marketplace_otp_verifications");
