const express = require("express");
const {
  createTicket,
  getMyTickets,
  getAllTickets,
  updateTicket,
} = require("../../controllers/shop/support-controller");
const {
  authMiddleware,
  requireAdmin,
} = require("../../controllers/auth/auth-controller");

const router = express.Router();

router.post("/create-ticket", authMiddleware, createTicket);
router.post("/create", authMiddleware, createTicket);
router.get("/my-tickets", authMiddleware, getMyTickets);
router.get("/user/:userId", authMiddleware, getMyTickets);
router.get("/all-tickets", authMiddleware, requireAdmin, getAllTickets);
router.get("/admin/all", authMiddleware, requireAdmin, getAllTickets);
router.put("/update-ticket/:id", authMiddleware, requireAdmin, updateTicket);
router.put("/admin/update/:id", authMiddleware, requireAdmin, updateTicket);

module.exports = router;
