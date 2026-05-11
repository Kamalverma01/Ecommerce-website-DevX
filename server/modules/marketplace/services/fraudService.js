const User = require("../models/User");
const Seller = require("../models/Seller");
const FraudLog = require("../models/FraudLog");
const Wallet = require("../models/Wallet");
const { marketplaceEvents, EVENTS } = require("../core/eventBus");

async function scoreOrder({ userId, paymentMethod, totalAmount, ip }) {
  const user = await User.findById(userId);
  let score = 0;
  const reasons = [];

  if (paymentMethod === "cod") {
    score += 25;
    reasons.push("COD order");
  }

  if (paymentMethod === "cod" && user?.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
    score += 25;
    reasons.push("COD from new user");
  }

  if (Number(totalAmount) >= Number(process.env.HIGH_VALUE_ORDER_AMOUNT || 25000)) {
    score += 25;
    reasons.push("High value order");
  }

  if (user?.fraud?.returnRate > 50) {
    score += 40;
    reasons.push("Customer return rate above 50%");
  }

  if (ip && user?.lastLoginIp && ip !== user.lastLoginIp) {
    score += 10;
    reasons.push("New IP address");
  }

  return { score: Math.min(score, 100), reasons };
}

async function enforceCodLimit(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found.");
  }

  const now = new Date();
  const windowStarted = user.fraud?.codWindowStartedAt;
  const sameWindow = windowStarted && now - windowStarted < 24 * 60 * 60 * 1000;

  if (!sameWindow) {
    user.fraud.codWindowStartedAt = now;
    user.fraud.codOrdersToday = 0;
  }

  if (user.fraud.codOrdersToday >= 5) {
    await FraudLog.create({
      actorType: "customer",
      userId,
      type: "cod_limit_exceeded",
      score: 80,
      severity: "high",
      message: "Customer exceeded COD limit of 5 orders per day.",
    });
    throw new Error("COD limit exceeded for today.");
  }

  user.fraud.codOrdersToday += 1;
  await user.save();
}

async function logHighRiskOrder(order) {
  if (order.riskScore < 70) {
    return null;
  }

  const log = await FraudLog.create({
    actorType: "customer",
    userId: order.userId,
    orderId: order._id,
    type: "high_risk_order",
    score: order.riskScore,
    severity: order.riskScore >= 90 ? "critical" : "high",
    message: `Order marked under review: ${order.riskReasons.join(", ")}`,
  });

  marketplaceEvents.emit(EVENTS.FRAUD_ALERT, { log, order });
  return log;
}

async function flagSeller(sellerId, reason, score = 75) {
  const seller = await Seller.findById(sellerId);
  if (!seller) {
    throw new Error("Seller not found.");
  }

  seller.analytics.fraudFlags += 1;
  if (score >= 80 || seller.analytics.returnRate > 50) {
    seller.walletFrozen = true;
    await Wallet.updateOne({ sellerId }, { isFrozen: true });
  }
  await seller.save();

  return FraudLog.create({
    actorType: "seller",
    sellerId,
    type: "seller_fraud_flag",
    score,
    severity: score >= 80 ? "high" : "medium",
    message: reason,
  });
}

module.exports = { scoreOrder, enforceCodLimit, logHighRiskOrder, flagSeller };
