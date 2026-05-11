let ioInstance = null;

function setIo(io) {
  ioInstance = io;
}

function getIo() {
  return ioInstance;
}

function emitSupportUpdate(userId, payload) {
  if (!ioInstance) return;

  if (userId) {
    ioInstance.to(`user:${userId}`).emit("support:updated", payload);
  }

  ioInstance.to("admins").emit("support:updated", payload);
}

function emitOrderUpdate(order) {
  if (!ioInstance || !order?._id) return;

  const payload = {
    orderId: order._id,
    userId: order.userId,
    orderStatus: order.orderStatus,
    orderUpdateDate: order.orderUpdateDate,
    deliveredAt: order.deliveredAt,
    trackingId: order.trackingId,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    totalAmount: order.totalAmount,
    addressInfo: order.addressInfo,
    sellerOrders: order.sellerOrders,
    sellerTotals: order.sellerTotals,
  };

  ioInstance.to(`order:${order._id}`).emit("order:updated", payload);

  if (order.userId) {
    ioInstance.to(`user:${order.userId}`).emit("order:updated", payload);
  }

  if (Array.isArray(order.sellerOrders)) {
    order.sellerOrders.forEach((sellerOrder) => {
      if (sellerOrder?.sellerId) {
        ioInstance.to(`seller:${sellerOrder.sellerId}`).emit("order:updated", {
          ...payload,
          sellerOrderId: sellerOrder._id,
          sellerOrderStatus: sellerOrder.orderStatus,
          sellerId: sellerOrder.sellerId,
        });
      }
    });
  }

  ioInstance.to("admins").emit("order:updated", payload);
}

module.exports = {
  setIo,
  getIo,
  emitSupportUpdate,
  emitOrderUpdate,
};
