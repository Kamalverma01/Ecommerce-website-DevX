const bcrypt = require("bcryptjs");
const Product = require("../models/Product");
const Order = require("../models/Order");
const { trackingId, numericOtp } = require("../core/id");
const { marketplaceEvents, EVENTS } = require("../core/eventBus");
const inventoryService = require("./inventoryService");
const commissionService = require("./commissionService");
const fraudService = require("./fraudService");

async function buildItems(items) {
  const productIds = items.map((item) => item.productId);
  const products = await Product.find({ _id: { $in: productIds }, status: "active" });
  const byId = new Map(products.map((product) => [String(product._id), product]));

  return items.map((item) => {
    const product = byId.get(String(item.productId));
    if (!product) {
      throw new Error(`Product ${item.productId} is not available.`);
    }

    const price = Number(product.salePrice || product.price);
    const quantity = Number(item.quantity);
    const commissionAmount = commissionService.calculate({
      price,
      quantity,
      rate: product.commissionRate,
    });

    return {
      productId: product._id,
      sellerId: product.sellerId,
      name: product.name || product.title,
      quantity,
      price,
      commissionRate: product.commissionRate,
      commissionAmount,
      sellerEarning: Number((price * quantity - commissionAmount).toFixed(2)),
    };
  });
}

async function placeOrder({ userId, payload, ip }) {
  const items = await buildItems(payload.items || []);
  if (payload.paymentMethod === "cod") {
    await fraudService.enforceCodLimit(userId);
  }

  const subtotal = Number(items.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2));
  const discountAmount = Number(payload.discountAmount || 0);
  const taxAmount = Number(((subtotal - discountAmount) * Number(process.env.GST_RATE || 0.18)).toFixed(2));
  const totalAmount = Number((subtotal - discountAmount + taxAmount).toFixed(2));
  const risk = await fraudService.scoreOrder({ userId, paymentMethod: payload.paymentMethod, totalAmount, ip });
  const otp = numericOtp();

  await inventoryService.reserveItems(items);

  const order = await Order.create({
    userId,
    items,
    sellerIds: [...new Set(items.map((item) => String(item.sellerId)))],
    status: risk.score >= 70 ? "under_review" : "placed",
    paymentMethod: payload.paymentMethod || "cod",
    paymentProvider: payload.paymentProvider || (payload.paymentMethod === "cod" ? "cod" : "razorpay"),
    trackingId: trackingId("ORD"),
    deliveryOtpHash: await bcrypt.hash(otp, 10),
    subtotal,
    discountAmount,
    taxAmount,
    totalAmount,
    riskScore: risk.score,
    riskReasons: risk.reasons,
    address: payload.address,
  });

  await commissionService.createPendingForOrder(order);
  marketplaceEvents.emit(EVENTS.ORDER_PLACED, { order, deliveryOtp: otp });

  return order;
}

async function updateStatus({ orderId, status, actor }) {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error("Order not found.");
  }

  order.status = status;
  if (status === "delivered") {
    order.deliveredAt = new Date();
  }
  if (status === "returned") {
    order.returnedAt = new Date();
  }
  await order.save();

  if (status === "delivered") {
    marketplaceEvents.emit(EVENTS.ORDER_DELIVERED, { order, actor });
  }
  if (status === "returned") {
    marketplaceEvents.emit(EVENTS.ORDER_RETURNED, { order, actor });
  }

  return order;
}

async function verifyDeliveryOtp({ orderId, otp }) {
  const order = await Order.findById(orderId).select("+deliveryOtpHash");
  if (!order || !(await bcrypt.compare(otp, order.deliveryOtpHash || ""))) {
    throw new Error("Invalid delivery OTP.");
  }

  order.deliveryOtpVerifiedAt = new Date();
  order.status = "delivered";
  order.deliveredAt = new Date();
  await order.save();
  marketplaceEvents.emit(EVENTS.ORDER_DELIVERED, { order, actor: "delivery_otp" });
  return order;
}

module.exports = { placeOrder, updateStatus, verifyDeliveryOtp };
