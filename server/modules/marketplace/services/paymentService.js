const Order = require("../models/Order");
const { marketplaceEvents, EVENTS } = require("../core/eventBus");

async function createPaymentIntent(orderId, provider = "razorpay") {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error("Order not found.");
  }

  return {
    provider,
    orderId: order._id,
    amount: order.totalAmount,
    currency: "INR",
    reference: `${provider}_${order.trackingId}`,
  };
}

async function markPaid({ orderId, reference, provider }) {
  const order = await Order.findByIdAndUpdate(
    orderId,
    { paymentStatus: "paid", paymentReference: reference, paymentProvider: provider },
    { new: true }
  );
  marketplaceEvents.emit(EVENTS.PAYMENT_CAPTURED, { order });
  return order;
}

async function refund({ orderId, reference }) {
  const order = await Order.findByIdAndUpdate(
    orderId,
    { paymentStatus: "refunded", paymentReference: reference },
    { new: true }
  );
  marketplaceEvents.emit(EVENTS.PAYMENT_REFUNDED, { order });
  return order;
}

module.exports = { createPaymentIntent, markPaid, refund };
