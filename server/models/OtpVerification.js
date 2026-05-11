const mongoose = require("mongoose");

const OtpVerificationSchema = new mongoose.Schema(
  {
    target: {
      type: String,
      required: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: ["register", "change-email", "change-phone", "change-password", "forgot-password"],
      required: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OtpVerification", OtpVerificationSchema);
