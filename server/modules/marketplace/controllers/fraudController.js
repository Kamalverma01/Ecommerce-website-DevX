const asyncHandler = require("../core/asyncHandler");
const { success } = require("../core/apiResponse");
const fraudService = require("../services/fraudService");
const FraudLog = require("../models/FraudLog");

const list = asyncHandler(async (req, res) => {
  const logs = await FraudLog.find().sort({ createdAt: -1 }).limit(100);
  return success(res, "Fraud logs fetched.", { logs });
});

const flagSeller = asyncHandler(async (req, res) => {
  const log = await fraudService.flagSeller(req.params.sellerId, req.body.reason, req.body.score);
  return success(res, "Seller fraud flag created.", { log }, 201);
});

module.exports = { list, flagSeller };
