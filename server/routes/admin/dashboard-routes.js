const express = require("express");
const { getAdminDashboardStats } = require("../../controllers/admin/dashboard-controller");
const { authMiddleware, requireAdmin } = require("../../controllers/auth/auth-controller");

const router = express.Router();

router.use(authMiddleware, requireAdmin);
router.get("/", getAdminDashboardStats);
router.get("/summary", getAdminDashboardStats);

module.exports = router;
