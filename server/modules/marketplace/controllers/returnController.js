const asyncHandler = require("../core/asyncHandler");
const { success } = require("../core/apiResponse");
const returnService = require("../services/returnService");

const requestReturn = asyncHandler(async (req, res) => {
  const request = await returnService.requestReturn({ userId: req.user._id, payload: req.body });
  return success(res, "Return requested.", { request }, 201);
});

const approveReturn = asyncHandler(async (req, res) => {
  const request = await returnService.approveReturn(req.params.returnId, req.body.adminNote);
  return success(res, "Return approved.", { request });
});

module.exports = { requestReturn, approveReturn };
