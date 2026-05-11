const { EventEmitter } = require("events");

const marketplaceEvents = new EventEmitter();
marketplaceEvents.setMaxListeners(50);

const EVENTS = Object.freeze({
  ORDER_PLACED: "orderPlaced",
  ORDER_DELIVERED: "orderDelivered",
  ORDER_RETURNED: "orderReturned",
  PAYMENT_CAPTURED: "paymentCaptured",
  PAYMENT_REFUNDED: "paymentRefunded",
  FRAUD_ALERT: "fraudAlert",
  LOW_STOCK: "lowStock",
});

module.exports = { marketplaceEvents, EVENTS };
