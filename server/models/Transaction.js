const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    amount: {
      type: Number,
      required: true,
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
    currency: {
      type: String,
      default: "INR",
    },
    provider: {
      type: String,
      default: "razorpay",
    },
    providerOrderId: String,
    providerPaymentId: String,
    providerSignature: String,
    paymentMethod: {
      type: String,
      default: "razorpay",
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },
    isPayoutPaid: {
      type: Boolean,
      default: false,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", TransactionSchema);
