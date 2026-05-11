const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceProduct", required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceSeller", required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    commissionRate: { type: Number, required: true, min: 0 },
    commissionAmount: { type: Number, default: 0 },
    sellerEarning: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["placed", "confirmed", "packed", "shipped", "out_for_delivery", "delivered", "returned"],
      default: "placed",
    },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceUser", required: true, index: true },
    items: [OrderItemSchema],
    sellerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "MarketplaceSeller", index: true }],
    status: {
      type: String,
      enum: [
        "placed",
        "confirmed",
        "packed",
        "shipped",
        "out_for_delivery",
        "delivered",
        "returned",
        "under_review",
        "cancelled",
      ],
      default: "placed",
      index: true,
    },
    paymentMethod: { type: String, enum: ["cod", "upi", "card", "netbanking"], default: "cod" },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
    paymentProvider: { type: String, enum: ["razorpay", "stripe", "cod", "none"], default: "none" },
    paymentReference: { type: String, default: "" },
    trackingId: { type: String, required: true, unique: true, index: true },
    deliveryOtpHash: { type: String, default: "", select: false },
    deliveryOtpVerifiedAt: { type: Date, default: null },
    subtotal: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    riskScore: { type: Number, default: 0 },
    riskReasons: [{ type: String }],
    address: {
      name: String,
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      phone: String,
    },
    deliveredAt: { type: Date, default: null },
    returnedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.MarketplaceOrder || mongoose.model("MarketplaceOrder", OrderSchema, "marketplace_orders");
