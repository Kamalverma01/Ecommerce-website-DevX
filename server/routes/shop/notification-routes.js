const express = require("express");
const {
  listMyNotifications,
  markNotificationRead,
  createNotification,
} = require("../../controllers/shop/notification-controller");
const { authMiddleware, requireAdmin } = require("../../controllers/auth/auth-controller");

const router = express.Router();

router.get("/my", authMiddleware, listMyNotifications);
router.put("/:id/read", authMiddleware, markNotificationRead);
router.post("/", authMiddleware, requireAdmin, createNotification);

module.exports = router;
