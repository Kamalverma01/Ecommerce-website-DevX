const Order = require("../models/Order");
const Product = require("../models/Product");

async function peopleAlsoBought(productId) {
  const orders = await Order.find({ "items.productId": productId }).select("items.productId").limit(100);
  const counts = new Map();

  for (const order of orders) {
    for (const item of order.items) {
      const id = String(item.productId);
      if (id !== String(productId)) counts.set(id, (counts.get(id) || 0) + 1);
    }
  }

  const productIds = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id]) => id);
  return Product.find({ _id: { $in: productIds }, status: "active" });
}

async function trending() {
  return Product.find({ status: "active" }).sort({ popularityScore: -1, createdAt: -1 }).limit(12);
}

module.exports = { peopleAlsoBought, trending };
