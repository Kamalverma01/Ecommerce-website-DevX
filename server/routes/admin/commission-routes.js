const express = require("express");
const {
  getCommissionSettings,
  setGlobalCommission,
} = require("../../controllers/admin/seller-controller");
const { authMiddleware, requireAdmin } = require("../../controllers/auth/auth-controller");

const router = express.Router();

router.use(authMiddleware, requireAdmin);
router.get("/", getCommissionSettings);
router.put("/", setGlobalCommission);

module.exports = router;
