const asyncHandler = require("../core/asyncHandler");
const { success } = require("../core/apiResponse");
const commissionService = require("../services/commissionService");
const paymentService = require("../services/paymentService");

const commissionSummary = asyncHandler(async (req, res) => {
  const summary = await commissionService.summary();
  return success(res, "Commission summary fetched.", { summary });
});

const createPaymentIntent = asyncHandler(async (req, res) => {
  const intent = await paymentService.createPaymentIntent(req.params.orderId, req.body.provider);
  return success(res, "Payment intent created.", { intent });
});

const markPaid = asyncHandler(async (req, res) => {
  const order = await paymentService.markPaid(req.body);
  return success(res, "Payment captured.", { order });
});

const refund = asyncHandler(async (req, res) => {
  const order = await paymentService.refund(req.body);
  return success(res, "Refund recorded.", { order });
});

module.exports = { commissionSummary, createPaymentIntent, markPaid, refund };
