const ORDER_STATUS_MAP = {
  pending: "pending",
  inprocess: "processing",
  processing: "processing",
  confirmed: "confirmed",
  inshipping: "shipped",
  shipped: "shipped",
  delivered: "delivered",
  cancelled: "cancelled",
  returned: "returned",
  rejected: "rejected",
};

function normalizeOrderStatus(status) {
  if (!status) return "";

  const key = String(status).trim().toLowerCase();
  return ORDER_STATUS_MAP[key] || key;
}

module.exports = {
  normalizeOrderStatus,
  ORDER_STATUS_MAP,
};
