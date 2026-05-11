const express = require("express");
const {
  getFinancialSummary,
  markPayoutPaid,
  updateCommissionSetting,
  getRevenueBreakdown,
  getSellerCommissionDetails,
  getFraudLogs,
  updateFraudLogStatus,
  getFraudLogStats,
} = require("../../controllers/admin/financial-controller");
const { authMiddleware, requireAdmin } = require("../../controllers/auth/auth-controller");

const router = express.Router();

router.use(authMiddleware, requireAdmin);

// Financial Summary Routes
router.get("/summary", getFinancialSummary);
router.put("/payouts/:id/pay", markPayoutPaid);
router.put("/commission", updateCommissionSetting);

// Revenue Routes
router.get("/revenue/breakdown", getRevenueBreakdown);

// Seller Commission Routes
router.get("/seller-commissions", getSellerCommissionDetails);

// Fraud Log Routes
router.get("/fraud-logs", getFraudLogs);
router.get("/fraud-logs/stats", getFraudLogStats);
router.put("/fraud-logs/:id/status", updateFraudLogStatus);

module.exports = router;
