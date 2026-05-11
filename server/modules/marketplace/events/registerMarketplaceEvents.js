const { marketplaceEvents, EVENTS } = require("../core/eventBus");
const commissionService = require("../services/commissionService");
const fraudService = require("../services/fraudService");
const notificationService = require("../services/notificationService");
const invoiceService = require("../services/invoiceService");
const inventoryService = require("../services/inventoryService");

let registered = false;

function registerMarketplaceEvents() {
  if (registered) {
    return;
  }
  registered = true;

  marketplaceEvents.on(EVENTS.ORDER_PLACED, async ({ order }) => {
    await fraudService.logHighRiskOrder(order);
    await notificationService.orderUpdate(order, order.status);
  });

  marketplaceEvents.on(EVENTS.ORDER_DELIVERED, async ({ order }) => {
    await commissionService.markEarned(order._id);
    await invoiceService.generate(order._id);
    await notificationService.orderUpdate(order, "delivered");
  });

  marketplaceEvents.on(EVENTS.ORDER_RETURNED, async ({ order }) => {
    await commissionService.reverse(order._id);
    await inventoryService.releaseItems(order.items);
    await notificationService.orderUpdate(order, "returned");
  });

  marketplaceEvents.on(EVENTS.FRAUD_ALERT, async ({ log }) => {
    await notificationService.fraudAlert(log);
  });

  marketplaceEvents.on(EVENTS.LOW_STOCK, async ({ product }) => {
    await notificationService.queue({
      sellerId: product.sellerId,
      channel: "in_app",
      type: "low_stock",
      title: "Low stock alert",
      body: `${product.name} is at ${product.stock} units.`,
      status: "sent",
      sentAt: new Date(),
      metadata: { productId: product._id },
    });
  });
}

module.exports = registerMarketplaceEvents;
