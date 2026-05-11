const asyncHandler = require("../core/asyncHandler");
const { success } = require("../core/apiResponse");
const reviewService = require("../services/reviewService");

const create = asyncHandler(async (req, res) => {
  const review = await reviewService.createReview({ userId: req.user._id, payload: req.body });
  return success(res, "Review submitted.", { review }, 201);
});

module.exports = { create };
