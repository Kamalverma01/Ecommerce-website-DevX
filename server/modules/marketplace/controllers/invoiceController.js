const asyncHandler = require("../core/asyncHandler");
const { success } = require("../core/apiResponse");
const invoiceService = require("../services/invoiceService");

const generate = asyncHandler(async (req, res) => {
  const invoice = await invoiceService.generate(req.params.orderId);
  return success(res, "Invoice generated.", { invoice });
});

module.exports = { generate };
