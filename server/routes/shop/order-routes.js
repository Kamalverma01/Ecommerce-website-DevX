const express = require("express");

const {
  createOrder,
  getAllOrdersByUser,
  getOrderDetails,
  capturePayment,
  updateOrderById,
} = require("../../controllers/shop/order-controller");
const { authMiddleware } = require("../../middleware/auth-middleware");

const router = express.Router();

function requireSameUser(req, res, next) {
  const requestedUserId = req.body.userId || req.params.userId;

  if (!requestedUserId || String(requestedUserId) !== String(req.user?.id)) {
    return res.status(403).json({
      success: false,
      message: "You can only access your own orders",
    });
  }

  next();
}

router.post("/create", authMiddleware, requireSameUser, createOrder);
router.post("/capture", authMiddleware, capturePayment);
router.get("/list/:userId", authMiddleware, requireSameUser, getAllOrdersByUser);
router.get("/details/:id", authMiddleware, getOrderDetails);
router.put("/update/:id", authMiddleware, updateOrderById);
router.put("/orders/update/:id", authMiddleware, updateOrderById);

module.exports = router;
