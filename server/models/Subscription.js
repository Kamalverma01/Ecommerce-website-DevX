const mongoose = require("mongoose");

const SubscriptionSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    plan: {
      type: String,
      enum: ["Basic", "Pro", "Premium"],
      default: "Basic",
    },
    status: {
      type: String,
      enum: ["active", "expired", "cancelled"],
      default: "active",
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    benefitsSnapshot: {
      commissionDiscount: {
        type: Number,
        default: 0,
      },
      visibilityBoost: {
        type: Number,
        default: 0,
      },
      productLimit: {
        type: Number,
        default: 0,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscription", SubscriptionSchema);
