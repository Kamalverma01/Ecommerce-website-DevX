const Order = require("../../models/Order");
const Product = require("../../models/Product");
const ProductReview = require("../../models/Review");
const User = require("../../models/User");

const addProductReview = async (req, res) => {
  try {
    const { productId, reviewMessage, reviewValue } = req.body;
    const userId = req.user?.id || req.body.userId;
    const user = userId ? await User.findById(userId).select("userName") : null;
    const userName = user?.userName || req.body.userName || "Customer";

    if (!productId || !reviewMessage || !Number(reviewValue)) {
      return res.status(400).json({
        success: false,
        message: "Product, rating, and review message are required.",
      });
    }

    const order = await Order.findOne({
      userId,
      "cartItems.productId": productId,
      $or: [
        { paymentStatus: "paid" },
        { orderStatus: "delivered" },
        { "sellerOrders.orderStatus": "delivered" },
      ],
    });

    if (!order) {
      return res.status(403).json({
        success: false,
        message: "You need to purchase product to review it.",
      });
    }

    const checkExistinfReview = await ProductReview.findOne({
      productId,
      userId,
    });

    if (checkExistinfReview) {
      return res.status(400).json({
        success: false,
        message: "You already reviewed this product!",
      });
    }

    const purchasedItem = order.cartItems.find(
      (item) => String(item.productId) === String(productId)
    );

    const newReview = new ProductReview({
      productId,
      userId,
      sellerId: purchasedItem?.sellerId,
      userName,
      reviewMessage,
      reviewValue,
      verifiedPurchase: true,
    });

    await newReview.save();

    const reviews = await ProductReview.find({ productId });
    const totalReviewsLength = reviews.length;
    const averageReview =
      reviews.reduce((sum, reviewItem) => sum + reviewItem.reviewValue, 0) /
      totalReviewsLength;

    await Product.findByIdAndUpdate(productId, { averageReview });

    res.status(201).json({
      success: true,
      data: newReview,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error",
    });
  }
};

const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await ProductReview.find({ productId });
    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error",
    });
  }
};

const getAllProductReviews = async (req, res) => {
  try {
    const reviews = await ProductReview.find()
      .populate("productId", "title image sellerId sellerName")
      .sort({ createdAt: -1 })
      .limit(200);

    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error",
    });
  }
};

const getSellerProductReviews = async (req, res) => {
  try {
    const reviews = await ProductReview.find({ sellerId: req.user.id })
      .populate("productId", "title image sellerId sellerName")
      .sort({ createdAt: -1 })
      .limit(200);

    res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({
      success: false,
      message: "Error",
    });
  }
};

module.exports = { addProductReview, getProductReviews, getAllProductReviews, getSellerProductReviews };
