const asyncHandler = require("../core/asyncHandler");
const { success } = require("../core/apiResponse");
const orderService = require("../services/orderService");
const Order = require("../models/Order");

const place = asyncHandler(async (req, res) => {
  const order = await orderService.placeOrder({ userId: req.user._id, payload: req.body, ip: req.ip });
  return success(res, "Order placed.", { order }, 201);
});

const updateStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateStatus({
    orderId: req.params.orderId,
    status: req.body.status,
    actor: req.user.role,
  });
  return success(res, "Order status updated.", { order });
});

const verifyDeliveryOtp = asyncHandler(async (req, res) => {
  const order = await orderService.verifyDeliveryOtp({ orderId: req.params.orderId, otp: req.body.otp });
  return success(res, "Delivery OTP verified and order delivered.", { order });
});

const adminList = asyncHandler(async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 }).limit(100);
  return success(res, "All orders fetched.", { orders });
});

module.exports = { place, updateStatus, verifyDeliveryOtp, adminList };
