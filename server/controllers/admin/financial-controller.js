const Transaction = require("../../models/Transaction");
const FraudLog = require("../../models/FraudLog");
const User = require("../../models/User");
const Order = require("../../models/Order");
const { getPlatformSetting, setPlatformSetting } = require("../../utils/platform-settings");

const getFinancialSummary = async (req, res) => {
  try {
    const result = await Transaction.aggregate([
      {
        $group: {
          _id: null,
          totalCommissionEarned: { $sum: "$commissionAmount" },
          totalSellerEarnings: { $sum: "$sellerEarning" },
          totalPlatformProfit: { $sum: "$platformProfit" },
          pendingPayoutCount: { $sum: { $cond: [{ $eq: ["$isPayoutPaid", false] }, 1, 0] } },
          pendingPayoutAmount: { $sum: { $cond: [{ $eq: ["$isPayoutPaid", false] }, "$sellerEarning", 0] } },
        },
      },
    ]);

    const data = result[0] || {
      totalCommissionEarned: 0,
      totalSellerEarnings: 0,
      totalPlatformProfit: 0,
      pendingPayoutCount: 0,
      pendingPayoutAmount: 0,
    };

    const globalCommission = await getPlatformSetting("globalCommissionPercent", 10);

    return res.status(200).json({ success: true, data: { ...data, globalCommission } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to fetch financial summary" });
  }
};

const markPayoutPaid = async (req, res) => {
  try {
    const { id } = req.params;
    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({ success: false, message: "Transaction not found" });
    }

    transaction.isPayoutPaid = true;
    await transaction.save();

    return res.status(200).json({ success: true, data: transaction });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to mark payout as paid" });
  }
};

const updateCommissionSetting = async (req, res) => {
  try {
    const { commissionPercent } = req.body;
    if (typeof commissionPercent === "undefined") {
      return res.status(400).json({ success: false, message: "commissionPercent is required" });
    }

    const value = Number(commissionPercent);
    await setPlatformSetting("globalCommissionPercent", value);

    return res.status(200).json({ success: true, data: { globalCommissionPercent: value } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to update commission settings" });
  }
};

const getRevenueBreakdown = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = "daily" } = req.query;
    
    const matchStage = { $match: { paymentStatus: "paid" } };
    
    if (startDate || endDate) {
      matchStage.$match.createdAt = {};
      if (startDate) matchStage.$match.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.$match.createdAt.$lte = new Date(endDate);
    }

    let groupStage = {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalAmount" },
        orderCount: { $sum: 1 },
        avgOrderValue: { $avg: "$totalAmount" },
      },
    };

    if (groupBy === "daily") {
      groupStage.$group._id = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
    } else if (groupBy === "monthly") {
      groupStage.$group._id = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
    } else if (groupBy === "category") {
      groupStage.$group._id = "$category";
    }

    const result = await Order.aggregate([
      matchStage,
      groupStage,
      { $sort: { _id: 1 } },
    ]);

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to fetch revenue breakdown" });
  }
};

const getSellerCommissionDetails = async (req, res) => {
  try {
    const { page = 1, limit = 10, sortBy = "commission", search } = req.query;
    const skip = (page - 1) * limit;

    const matchStage = { $match: {} };
    if (search) {
      matchStage.$match.$or = [
        { "sellerData.businessName": new RegExp(search, "i") },
        { "sellerData.email": new RegExp(search, "i") },
      ];
    }

    const result = await Transaction.aggregate([
      { $match: { sellerId: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: "$sellerId",
          totalEarnings: { $sum: "$sellerEarning" },
          totalCommissionPaid: { $sum: "$commissionAmount" },
          totalOrders: { $sum: 1 },
          pendingPayouts: { $sum: { $cond: [{ $eq: ["$isPayoutPaid", false] }, "$sellerEarning", 0] } },
          paidPayouts: { $sum: { $cond: [{ $eq: ["$isPayoutPaid", true] }, "$sellerEarning", 0] } },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userData",
        },
      },
      { $unwind: { path: "$userData", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "sellers",
          localField: "_id",
          foreignField: "userId",
          as: "sellerData",
        },
      },
      { $unwind: { path: "$sellerData", preserveNullAndEmptyArrays: true } },
      matchStage,
      {
        $project: {
          sellerId: "$_id",
          sellerName: "$userData.userName",
          businessName: { $ifNull: ["$sellerData.businessName", "N/A"] },
          email: "$userData.email",
          phone: "$userData.phone",
          totalEarnings: 1,
          totalCommissionPaid: 1,
          totalOrders: 1,
          pendingPayouts: 1,
          paidPayouts: 1,
        },
      },
      {
        $sort:
          sortBy === "commission" ? { totalEarnings: -1 } : { totalOrders: -1 },
      },
      { $skip: skip },
      { $limit: parseInt(limit) },
    ]);

    const totalCount = await Transaction.distinct("sellerId", {
      sellerId: { $exists: true, $ne: null },
    });

    return res.status(200).json({
      success: true,
      data: result,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount.length / limit),
        totalRecords: totalCount.length,
      },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Unable to fetch seller commission details",
      });
  }
};

const getFraudLogs = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, sortBy = "createdAt" } = req.query;
    const skip = (page - 1) * limit;

    const matchStage = { $match: {} };
    if (status) {
      matchStage.$match.status = status;
    }

    const result = await FraudLog.aggregate([
      matchStage,
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "userData",
        },
      },
      { $unwind: { path: "$userData", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "orders",
          localField: "orderId",
          foreignField: "_id",
          as: "orderData",
        },
      },
      { $unwind: { path: "$orderData", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "users",
          localField: "sellerId",
          foreignField: "_id",
          as: "sellerData",
        },
      },
      { $unwind: { path: "$sellerData", preserveNullAndEmptyArrays: true } },
      {
        $sort: { [sortBy]: -1 },
      },
      { $skip: skip },
      { $limit: parseInt(limit) },
      {
        $project: {
          _id: 1,
          userId: 1,
          orderId: 1,
          sellerId: 1,
          riskType: 1,
          riskScore: 1,
          status: 1,
          metadata: 1,
          createdAt: 1,
          userName: "$userData.userName",
          userEmail: "$userData.email",
          orderAmount: "$orderData.totalAmount",
          orderStatus: "$orderData.orderStatus",
          sellerName: "$sellerData.userName",
          sellerEmail: "$sellerData.email",
        },
      },
    ]);

    const totalCount = await FraudLog.countDocuments(matchStage.$match);

    const statusSummary = await FraudLog.aggregate([
      matchStage,
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    return res.status(200).json({
      success: true,
      data: result,
      statusSummary,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalRecords: totalCount,
      },
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Unable to fetch fraud logs",
      });
  }
};

const updateFraudLogStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (
      !["open", "under_review", "resolved", "false_positive"].includes(status)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status" });
    }

    const fraudLog = await FraudLog.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!fraudLog) {
      return res
        .status(404)
        .json({ success: false, message: "Fraud log not found" });
    }

    return res.status(200).json({ success: true, data: fraudLog });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Unable to update fraud log status",
      });
  }
};

const getFraudLogStats = async (req, res) => {
  try {
    const stats = await FraudLog.aggregate([
      {
        $facet: {
          byStatus: [
            { $group: { _id: "$status", count: { $sum: 1 } } },
          ],
          byRiskType: [
            { $group: { _id: "$riskType", count: { $sum: 1 } } },
          ],
          riskScoreDistribution: [
            {
              $bucket: {
                groupBy: "$riskScore",
                boundaries: [0, 20, 40, 60, 80, 100],
                default: "other",
                output: { count: { $sum: 1 } },
              },
            },
          ],
          totalFraudCases: [{ $count: "total" }],
          averageRiskScore: [
            {
              $group: {
                _id: null,
                avgScore: { $avg: "$riskScore" },
              },
            },
          ],
        },
      },
    ]);

    return res.status(200).json({ success: true, data: stats[0] });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({
        success: false,
        message: "Unable to fetch fraud log statistics",
      });
  }
};

module.exports = {
  getFinancialSummary,
  markPayoutPaid,
  updateCommissionSetting,
  getRevenueBreakdown,
  getSellerCommissionDetails,
  getFraudLogs,
  updateFraudLogStatus,
  getFraudLogStats,
};
