const mongoose = require("mongoose");

const CommissionSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceOrder", required: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceProduct", required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceSeller", required: true, index: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    rate: { type: Number, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "earned", "reversed", "paid"], default: "pending", index: true },
    earnedAt: { type: Date, default: null },
    paidAt: { type: Date, default: null },
    reversedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

CommissionSchema.index({ orderId: 1, productId: 1 }, { unique: true });

module.exports =
  mongoose.models.MarketplaceCommission ||
  mongoose.model("MarketplaceCommission", CommissionSchema, "marketplace_commissions");
