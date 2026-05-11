const asyncHandler = require("../core/asyncHandler");
const { success } = require("../core/apiResponse");
const analyticsService = require("../services/analyticsService");
const sellerService = require("../services/sellerService");

const admin = asyncHandler(async (req, res) => {
  const overview = await analyticsService.adminOverview();
  return success(res, "Admin analytics fetched.", { overview });
});

const seller = asyncHandler(async (req, res) => {
  const sellerDoc = await sellerService.getVerifiedSellerByUser(req.user._id);
  const overview = await analyticsService.sellerOverview(sellerDoc._id);
  return success(res, "Seller analytics fetched.", { overview });
});

module.exports = { admin, seller };
