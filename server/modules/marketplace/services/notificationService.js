const Notification = require("../models/Notification");

async function queue(payload) {
  return Notification.create(payload);
}

async function orderUpdate(order, status) {
  return queue({
    userId: order.userId,
    channel: "in_app",
    type: "order_update",
    title: "Order updated",
    body: `Your order ${order.trackingId} is now ${status}.`,
    status: "sent",
    sentAt: new Date(),
    metadata: { orderId: order._id, status },
  });
}

async function fraudAlert(log) {
  return queue({
    channel: "in_app",
    type: "fraud_alert",
    title: "Fraud alert",
    body: log.message,
    status: "sent",
    sentAt: new Date(),
    metadata: { logId: log._id },
  });
}

module.exports = { queue, orderUpdate, fraudAlert };
