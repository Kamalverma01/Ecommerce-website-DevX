const ReturnRequest = require("../models/ReturnRequest");
const Order = require("../models/Order");
const { marketplaceEvents, EVENTS } = require("../core/eventBus");

async function requestReturn({ userId, payload }) {
  const order = await Order.findOne({ _id: payload.orderId, userId, status: "delivered" });
  if (!order) {
    throw new Error("Return can be requested only for delivered orders.");
  }

  const sellerId = payload.sellerId || order.items[0]?.sellerId;
  return ReturnRequest.create({ orderId: order._id, userId, sellerId, reason: payload.reason });
}

async function approveReturn(returnId, adminNote = "") {
  const request = await ReturnRequest.findByIdAndUpdate(
    returnId,
    { status: "approved", adminNote },
    { new: true }
  );
  const order = await Order.findByIdAndUpdate(
    request.orderId,
    { status: "returned", returnedAt: new Date() },
    { new: true }
  );
  marketplaceEvents.emit(EVENTS.ORDER_RETURNED, { order });
  return request;
}

module.exports = { requestReturn, approveReturn };
