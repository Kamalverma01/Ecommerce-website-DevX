const mongoose = require("mongoose");

const WalletSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceSeller", required: true, unique: true },
    totalEarnings: { type: Number, default: 0 },
    commissionDeducted: { type: Number, default: 0 },
    availableBalance: { type: Number, default: 0 },
    frozenBalance: { type: Number, default: 0 },
    isFrozen: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.MarketplaceWallet || mongoose.model("MarketplaceWallet", WalletSchema, "marketplace_wallets");
