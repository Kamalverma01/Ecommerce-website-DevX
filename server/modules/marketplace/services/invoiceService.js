const Invoice = require("../models/Invoice");
const Order = require("../models/Order");

async function generate(orderId) {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error("Order not found.");
  }

  return Invoice.findOneAndUpdate(
    { orderId },
    {
      invoiceNumber: `INV-${order.trackingId}`,
      taxableAmount: Number((order.totalAmount - order.taxAmount).toFixed(2)),
      gstAmount: order.taxAmount,
      totalAmount: order.totalAmount,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

module.exports = { generate };
