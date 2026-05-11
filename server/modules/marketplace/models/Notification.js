const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceUser", default: null, index: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceSeller", default: null, index: true },
    channel: { type: String, enum: ["email", "sms", "in_app"], required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    status: { type: String, enum: ["queued", "sent", "failed"], default: "queued" },
    sentAt: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.MarketplaceNotification ||
  mongoose.model("MarketplaceNotification", NotificationSchema, "marketplace_notifications");
