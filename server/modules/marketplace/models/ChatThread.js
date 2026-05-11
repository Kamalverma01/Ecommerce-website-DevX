const mongoose = require("mongoose");

const ChatMessageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceUser", required: true },
    body: { type: String, required: true, trim: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const ChatThreadSchema = new mongoose.Schema(
  {
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceUser", required: true, index: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceSeller", required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceOrder", default: null, index: true },
    messages: [ChatMessageSchema],
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.MarketplaceChatThread ||
  mongoose.model("MarketplaceChatThread", ChatThreadSchema, "marketplace_chat_threads");
