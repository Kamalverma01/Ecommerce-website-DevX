const express = require("express");
const {
  listSellerApplications,
  getSellerDetails,
  approveSeller,
  rejectSeller,
  updateSellerCommissionOverride,
  getCommissionSettings,
  setGlobalCommission,
} = require("../../controllers/admin/seller-controller");
const { authMiddleware, requireAdmin } = require("../../controllers/auth/auth-controller");

const router = express.Router();

router.use(authMiddleware, requireAdmin);

router.get("/applications", listSellerApplications);
router.get("/applications/:id", getSellerDetails);
router.put("/applications/:id/approve", approveSeller);
router.put("/:id/approve", approveSeller);
router.put("/applications/:id/reject", rejectSeller);
router.put("/:id/reject", rejectSeller);
router.put("/:id/commission", updateSellerCommissionOverride);
router.get("/commission/settings", getCommissionSettings);
router.put("/commission/settings", setGlobalCommission);
router.get("/commission", getCommissionSettings);
router.put("/commission", setGlobalCommission);

module.exports = router;
