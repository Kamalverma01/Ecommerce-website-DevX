const Order = require("../models/Order");
const Commission = require("../models/Commission");
const FraudLog = require("../models/FraudLog");

async function adminOverview() {
  const [revenue] = await Order.aggregate([
    { $match: { paymentStatus: { $in: ["paid", "pending"] } } },
    { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" }, orders: { $sum: 1 } } },
  ]);
  const commission = await Commission.aggregate([
    { $group: { _id: "$status", total: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);
  const fraud = await FraudLog.aggregate([
    { $group: { _id: "$severity", count: { $sum: 1 } } },
  ]);

  return { revenue: revenue || { totalRevenue: 0, orders: 0 }, commission, fraud };
}

async function sellerOverview(sellerId) {
  const sales = await Order.aggregate([
    { $match: { sellerIds: sellerId } },
    { $unwind: "$items" },
    { $match: { "items.sellerId": sellerId } },
    { $group: { _id: "$items.productId", units: { $sum: "$items.quantity" }, revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } } } },
    { $sort: { revenue: -1 } },
  ]);

  return { sales };
}

module.exports = { adminOverview, sellerOverview };
