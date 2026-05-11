const express = require("express");

const {
  addToCart,
  fetchCartItems,
  deleteCartItem,
  updateCartItemQty,
} = require("../../controllers/shop/cart-controller");
const { authMiddleware } = require("../../middleware/auth-middleware");

const router = express.Router();

function requireSameUser(req, res, next) {
  const requestedUserId = req.body.userId || req.params.userId;

  if (!requestedUserId || String(requestedUserId) !== String(req.user?.id)) {
    return res.status(403).json({
      success: false,
      message: "You can only access your own cart",
    });
  }

  next();
}

router.post("/add", authMiddleware, requireSameUser, addToCart);
router.get("/get/:userId", authMiddleware, requireSameUser, fetchCartItems);
router.put("/update-cart", authMiddleware, requireSameUser, updateCartItemQty);
router.delete("/:userId/:productId", authMiddleware, requireSameUser, deleteCartItem);

module.exports = router;
