const mongoose = require("mongoose");

const InventoryLogSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    action: {
      type: String,
      enum: ["created", "increase", "decrease", "sold", "returned", "manual_adjustment"],
      required: true,
    },
    quantityChange: {
      type: Number,
      required: true,
    },
    beforeStock: {
      type: Number,
      default: 0,
    },
    afterStock: {
      type: Number,
      default: 0,
    },
    source: {
      type: String,
      default: "system",
      trim: true,
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InventoryLog", InventoryLogSchema);
