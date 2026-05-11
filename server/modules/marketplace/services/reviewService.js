const Review = require("../models/Review");
const Order = require("../models/Order");
const Product = require("../models/Product");

function spamScore(comment) {
  const text = String(comment || "").toLowerCase();
  let score = 0;
  if (/(http|www\.|free money|promo code)/.test(text)) score += 50;
  if (text.length < 10) score += 25;
  if (/(.)\1{5,}/.test(text)) score += 25;
  return Math.min(score, 100);
}

async function createReview({ userId, payload }) {
  const order = await Order.findOne({
    _id: payload.orderId,
    userId,
    status: "delivered",
    "items.productId": payload.productId,
  });

  if (!order) {
    throw new Error("Only verified buyers can review delivered products.");
  }

  const score = spamScore(payload.comment);
  const review = await Review.create({
    userId,
    productId: payload.productId,
    orderId: payload.orderId,
    rating: payload.rating,
    title: payload.title,
    comment: payload.comment,
    spamScore: score,
    status: score >= 60 ? "under_review" : "published",
  });

  const stats = await Review.aggregate([
    { $match: { productId: review.productId, status: "published" } },
    { $group: { _id: "$productId", averageRating: { $avg: "$rating" }, reviewCount: { $sum: 1 } } },
  ]);

  if (stats[0]) {
    await Product.updateOne(
      { _id: review.productId },
      {
        averageRating: Number(stats[0].averageRating.toFixed(2)),
        reviewCount: stats[0].reviewCount,
      }
    );
  }

  return review;
}

module.exports = { createReview };
