const User = require("../../models/User");
const Seller = require("../../models/Seller");
const Order = require("../../models/Order");
const Transaction = require("../../models/Transaction");
const Product = require("../../models/Product");
const { getPlatformSetting } = require("../../utils/platform-settings");

const getAdminDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalSellers, totalOrders, totalProducts, totalTransactions, globalCommission] = await Promise.all([
      User.countDocuments({}),
      Seller.countDocuments({ status: "approved" }),
      Order.countDocuments({}),
      Product.countDocuments({}),
      Transaction.countDocuments({}),
      getPlatformSetting("globalCommissionPercent", 10),
    ]);

    const revenueResult = await Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
    ]);

    const commissionResult = await Transaction.aggregate([
      { $group: { _id: null, totalCommission: { $sum: "$commissionAmount" }, pendingPayouts: { $sum: { $cond: [{ $eq: ["$isPayoutPaid", false] }, "$sellerEarning", 0] } } } },
    ]);

    const totalRevenue = revenueResult[0]?.totalRevenue || 0;
    const totalCommission = commissionResult[0]?.totalCommission || 0;
    const sellerPayoutsPending = commissionResult[0]?.pendingPayouts || 0;

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalSellers,
        totalOrders,
        totalProducts,
        totalRevenue,
        totalCommission,
        sellerPayoutsPending,
        globalCommission,
        totalTransactions,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to fetch dashboard metrics" });
  }
};

module.exports = {
  getAdminDashboardStats,
};
