const asyncHandler = require("../core/asyncHandler");
const { success, failure } = require("../core/apiResponse");
const authService = require("../services/authService");

const register = asyncHandler(async (req, res) => {
  const user = await authService.registerCustomer(req.body);
  return success(res, "Customer registered. OTP verification queued.", { userId: user._id }, 201);
});

const login = asyncHandler(async (req, res) => {
  const data = await authService.login({ ...req.body, ip: req.ip });
  return success(res, "Login successful.", data);
});

const refresh = asyncHandler(async (req, res) => {
  const data = await authService.refresh(req.body.refreshToken);
  return success(res, "Access token refreshed.", data);
});

const requestOtp = asyncHandler(async (req, res) => {
  const data = await authService.issueOtp(req.body);
  return success(res, "OTP queued.", data);
});

const verifyOtp = asyncHandler(async (req, res) => {
  await authService.verifyOtp(req.body);
  return success(res, "OTP verified.");
});

module.exports = { register, login, refresh, requestOtp, verifyOtp };
