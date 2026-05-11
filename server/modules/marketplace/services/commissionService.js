const Commission = require("../models/Commission");
const Wallet = require("../models/Wallet");

function calculate({ price, quantity, rate }) {
  return Number(((Number(price) * Number(quantity) * Number(rate)) / 100).toFixed(2));
}

async function createPendingForOrder(order) {
  const records = order.items.map((item) => ({
    orderId: order._id,
    productId: item.productId,
    sellerId: item.sellerId,
    price: item.price,
    quantity: item.quantity,
    rate: item.commissionRate,
    amount: calculate(item),
    status: "pending",
  }));

  if (!records.length) {
    return [];
  }

  return Commission.insertMany(records, { ordered: false });
}

async function markEarned(orderId) {
  const commissions = await Commission.find({ orderId, status: "pending" });
  for (const commission of commissions) {
    commission.status = "earned";
    commission.earnedAt = new Date();
    await commission.save();

    const gross = Number((commission.price * commission.quantity).toFixed(2));
    const net = Number((gross - commission.amount).toFixed(2));
    await Wallet.updateOne(
      { sellerId: commission.sellerId },
      {
        $inc: {
          totalEarnings: net,
          commissionDeducted: commission.amount,
          availableBalance: net,
        },
      },
      { upsert: true }
    );
  }

  return commissions.length;
}

async function reverse(orderId) {
  const commissions = await Commission.find({ orderId, status: { $in: ["pending", "earned"] } });
  for (const commission of commissions) {
    const wasEarned = commission.status === "earned";
    commission.status = "reversed";
    commission.reversedAt = new Date();
    await commission.save();

    if (wasEarned) {
      const gross = Number((commission.price * commission.quantity).toFixed(2));
      const net = Number((gross - commission.amount).toFixed(2));
      await Wallet.updateOne(
        { sellerId: commission.sellerId },
        {
          $inc: {
            totalEarnings: -net,
            commissionDeducted: -commission.amount,
            availableBalance: -net,
          },
        }
      );
    }
  }

  return commissions.length;
}

async function summary() {
  const rows = await Commission.aggregate([
    { $group: { _id: "$status", total: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);

  return rows.reduce(
    (acc, row) => ({ ...acc, [row._id]: { total: row.total, count: row.count } }),
    { pending: { total: 0, count: 0 }, earned: { total: 0, count: 0 }, reversed: { total: 0, count: 0 }, paid: { total: 0, count: 0 } }
  );
}

module.exports = { calculate, createPendingForOrder, markEarned, reverse, summary };
