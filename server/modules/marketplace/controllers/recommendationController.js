const asyncHandler = require("../core/asyncHandler");
const { success } = require("../core/apiResponse");
const recommendationService = require("../services/recommendationService");

const alsoBought = asyncHandler(async (req, res) => {
  const products = await recommendationService.peopleAlsoBought(req.params.productId);
  return success(res, "People also bought fetched.", { products });
});

const trending = asyncHandler(async (req, res) => {
  const products = await recommendationService.trending();
  return success(res, "Trending products fetched.", { products });
});

module.exports = { alsoBought, trending };
