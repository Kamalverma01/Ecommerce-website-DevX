const mongoose = require("mongoose");

const WalletSchema = new mongoose.Schema(
  {
    ownerType: {
      type: String,
      enum: ["customer", "seller"],
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    ledger: [
      {
        type: {
          type: String,
          enum: ["credit", "debit"],
          required: true,
        },
        amount: Number,
        reason: String,
        referenceId: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

WalletSchema.index({ ownerType: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model("Wallet", WalletSchema);
