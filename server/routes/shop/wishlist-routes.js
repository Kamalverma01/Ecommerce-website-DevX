const express = require("express");
const Wishlist = require("../../models/Wishlist");
const { authMiddleware } = require("../../middleware/auth-middleware");

const router = express.Router();

function requireSameUser(req, res, next) {
  const requestedUserId = req.body.userId || req.params.userId;

  if (!requestedUserId || String(requestedUserId) !== String(req.user?.id)) {
    return res.status(403).json({
      success: false,
      message: "You can only access your own wishlist",
    });
  }

  next();
}

async function addWishlistItem(req, res) {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid data provided!" });
    }

    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      wishlist = new Wishlist({ userId, products: [] });
    }

    const isAlreadyAdded = wishlist.products.find(
      (product) => product.productId.toString() === productId
    );

    if (!isAlreadyAdded) {
      wishlist.products.push({ productId });
      await wishlist.save();
    }

    res.status(200).json({ success: true, data: wishlist });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error occurred" });
  }
}

async function getWishlist(req, res) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is mandatory!" });
    }

    const wishlist = await Wishlist.findOne({ userId }).populate({
      path: "products.productId",
      select: "image title price salePrice",
    });

    if (!wishlist) {
      return res
        .status(404)
        .json({ success: false, message: "Wishlist not found!" });
    }

    res.status(200).json({ success: true, data: wishlist });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error occurred" });
  }
}

async function removeWishlistItem(req, res) {
  try {
    const { userId, productId } = req.params;

    if (!userId || !productId) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid data provided!" });
    }

    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      return res
        .status(404)
        .json({ success: false, message: "Wishlist not found!" });
    }

    wishlist.products = wishlist.products.filter(
      (product) => product.productId.toString() !== productId
    );

    await wishlist.save();

    res.status(200).json({ success: true, data: wishlist });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error occurred" });
  }
}

router.post("/", authMiddleware, requireSameUser, addWishlistItem);
router.post("/add", authMiddleware, requireSameUser, addWishlistItem);
router.get("/:userId", authMiddleware, requireSameUser, getWishlist);
router.get("/get/:userId", authMiddleware, requireSameUser, getWishlist);
router.delete("/:userId/:productId", authMiddleware, requireSameUser, removeWishlistItem);
router.delete("/remove/:userId/:productId", authMiddleware, requireSameUser, removeWishlistItem);

module.exports = router;
