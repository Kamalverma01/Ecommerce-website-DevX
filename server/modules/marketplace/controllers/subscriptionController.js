const asyncHandler = require("../core/asyncHandler");
const { success } = require("../core/apiResponse");
const Subscription = require("../models/Subscription");
const Seller = require("../models/Seller");
const { PLAN_LIMITS } = require("../services/sellerService");

const updatePlan = asyncHandler(async (req, res) => {
  const plan = req.body.plan;
  const limits = PLAN_LIMITS[plan];
  if (!limits) {
    throw new Error("Invalid subscription plan.");
  }

  const seller = await Seller.findOne({ userId: req.user._id });
  if (!seller) {
    throw new Error("Seller profile not found.");
  }

  const subscription = await Subscription.findOneAndUpdate(
    { sellerId: seller._id },
    { plan, ...limits, status: "active", startsAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Seller.updateOne({ _id: seller._id }, { subscriptionPlan: plan });
  return success(res, "Subscription updated.", { subscription });
});

module.exports = { updatePlan };
