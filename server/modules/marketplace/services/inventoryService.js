const Product = require("../models/Product");
const { marketplaceEvents, EVENTS } = require("../core/eventBus");

async function reserveItems(items) {
  for (const item of items) {
    const product = await Product.findOneAndUpdate(
      { _id: item.productId, stock: { $gte: item.quantity }, status: "active" },
      { $inc: { stock: -item.quantity, reservedStock: item.quantity } },
      { new: true }
    );

    if (!product) {
      throw new Error(`Insufficient stock for product ${item.productId}.`);
    }

    if (product.stock <= product.lowStockThreshold) {
      marketplaceEvents.emit(EVENTS.LOW_STOCK, { product });
    }
  }
}

async function releaseItems(items) {
  await Promise.all(
    items.map((item) =>
      Product.updateOne(
        { _id: item.productId },
        { $inc: { stock: item.quantity, reservedStock: -item.quantity } }
      )
    )
  );
}

async function bulkUpsert(rows, seller) {
  const operations = rows.map((row) => ({
    updateOne: {
      filter: { _id: row.productId, sellerId: seller._id },
      update: { $set: { stock: Number(row.stock), lowStockThreshold: Number(row.lowStockThreshold || 5) } },
    },
  }));

  if (!operations.length) {
    return { modifiedCount: 0 };
  }

  return Product.bulkWrite(operations);
}

module.exports = { reserveItems, releaseItems, bulkUpsert };
