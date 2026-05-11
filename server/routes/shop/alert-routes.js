const express = require("express");
const {
  createAlert,
  getUserAlerts,
  markAlertAsRead,
} = require("../../controllers/shop/alert-controller");
const { authMiddleware, requireAdmin } = require("../../controllers/auth/auth-controller");

const router = express.Router();

router.post("/create", authMiddleware, requireAdmin, createAlert);
router.get("/user", authMiddleware, getUserAlerts);
router.put("/read/:alertId", authMiddleware, markAlertAsRead);

module.exports = router;
