const razorpay = require("../../helpers/paypal");
const Order = require("../../models/Order");
const Cart = require("../../models/Cart");
const Product = require("../../models/Product");
const Transaction = require("../../models/Transaction");
const OrderItem = require("../../models/OrderItem");
const crypto = require("crypto");
const { normalizeOrderStatus } = require("../../utils/order-status");
const { getPlatformSetting } = require("../../utils/platform-settings");
const { emitOrderUpdate } = require("../../utils/realtime");

const createOrder = async (req, res) => {
  try {
    const {
      userId,
      cartItems,
      addressInfo,
      orderStatus,
      paymentMethod,
      paymentStatus,
      totalAmount,
      orderDate,
      orderUpdateDate,
      cartId,
      couponCode,
      giftCardCode,
      discountAmount,
    } = req.body;

    const defaultCommissionPercent = Number(
      await getPlatformSetting("globalCommissionPercent", 10)
    );

    const enrichedItems = await Promise.all(
      (cartItems || []).map(async (item) => {
        const product = item.productId
          ? await Product.findById(item.productId)
          : null;

        const sellerId = item.sellerId || product?.sellerId || null;
        const sellerName = item.sellerName || product?.sellerName || "Platform";
        const price = Number(item.price || product?.price || 0);
        const quantity = Number(item.quantity || 1);
        const commissionPercent = Number(
          item.commissionPercent || product?.commissionPercent || defaultCommissionPercent
        );
        const lineTotal = Number((price * quantity).toFixed(2));
        const commissionAmount = Number(
          ((lineTotal * commissionPercent) / 100).toFixed(2)
        );
        const sellerEarning = Number((lineTotal - commissionAmount).toFixed(2));
        const platformProfit = Number(commissionAmount.toFixed(2));

        return {
          productId: item.productId,
          sellerId,
          sellerName,
          title: item.title || product?.title || "",
          image: item.image || product?.image || "",
          price,
          quantity,
          lineTotal,
          commissionPercent,
          commissionAmount,
          sellerEarning,
          platformProfit,
        };
      })
    );

    const sellerTotalsMap = {};
    const sellerOrdersMap = {};

    enrichedItems.forEach((item) => {
      const key = String(item.sellerId || "platform");
      if (!sellerTotalsMap[key]) {
        sellerTotalsMap[key] = {
          sellerId: item.sellerId,
          sellerName: item.sellerName,
          itemsTotal: 0,
          sellerEarning: 0,
          commissionAmount: 0,
          platformProfit: 0,
          payoutStatus: "pending",
        };
      }

      if (!sellerOrdersMap[key]) {
        sellerOrdersMap[key] = {
          sellerId: item.sellerId,
          sellerName: item.sellerName,
          items: [],
          subtotal: 0,
          commissionTotal: 0,
          sellerEarningTotal: 0,
          platformProfitTotal: 0,
          orderStatus: "processing",
        };
      }

      sellerTotalsMap[key].itemsTotal += item.lineTotal;
      sellerTotalsMap[key].sellerEarning += item.sellerEarning;
      sellerTotalsMap[key].commissionAmount += item.commissionAmount;
      sellerTotalsMap[key].platformProfit += item.platformProfit;

      sellerOrdersMap[key].items.push(item);
      sellerOrdersMap[key].subtotal += item.lineTotal;
      sellerOrdersMap[key].commissionTotal += item.commissionAmount;
      sellerOrdersMap[key].sellerEarningTotal += item.sellerEarning;
      sellerOrdersMap[key].platformProfitTotal += item.platformProfit;
    });

    const sellerTotals = Object.values(sellerTotalsMap).map((summary) => ({
      sellerId: summary.sellerId,
      sellerName: summary.sellerName,
      itemsTotal: Number(summary.itemsTotal.toFixed(2)),
      sellerEarning: Number(summary.sellerEarning.toFixed(2)),
      commissionAmount: Number(summary.commissionAmount.toFixed(2)),
      platformProfit: Number(summary.platformProfit.toFixed(2)),
      payoutStatus: summary.payoutStatus,
    }));

    const sellerOrders = Object.values(sellerOrdersMap).map((summary) => ({
      sellerId: summary.sellerId,
      sellerName: summary.sellerName,
      items: summary.items,
      subtotal: Number(summary.subtotal.toFixed(2)),
      commissionTotal: Number(summary.commissionTotal.toFixed(2)),
      sellerEarningTotal: Number(summary.sellerEarningTotal.toFixed(2)),
      platformProfitTotal: Number(summary.platformProfitTotal.toFixed(2)),
      orderStatus: summary.orderStatus,
    }));

    const orderPayload = {
      userId,
      cartId,
      cartItems: enrichedItems,
      addressInfo,
      orderStatus: orderStatus || "pending",
      paymentMethod: paymentMethod || "cod",
      paymentStatus: paymentMethod === "cod" ? "pending" : paymentStatus || "pending",
      totalAmount: Number(totalAmount || 0),
      discountAmount: Number(discountAmount || 0),
      couponCode: couponCode || "",
      giftCardCode: giftCardCode || "",
      sellerTotals,
      sellerOrders,
      orderDate: orderDate ? new Date(orderDate) : new Date(),
      orderUpdateDate: orderUpdateDate ? new Date(orderUpdateDate) : new Date(),
    };

    if (paymentMethod !== "cod") {
      const options = {
        amount: Math.round(Number(totalAmount || 0) * 100),
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
      };

      const razorpayOrder = await razorpay.orders.create(options);
      if (!razorpayOrder) {
        return res.status(500).json({
          success: false,
          message: "Error while creating Razorpay order",
        });
      }

      orderPayload.paymentId = razorpayOrder.id;
      orderPayload.payerId = "";
      orderPayload.razorpayOrderId = razorpayOrder.id;
      orderPayload.paymentStatus = paymentStatus || "pending";
    }

    const newlyCreatedOrder = new Order(orderPayload);
    await newlyCreatedOrder.save();

    await OrderItem.insertMany(
      enrichedItems.map((item) => ({
        orderId: newlyCreatedOrder._id,
        userId,
        productId: item.productId,
        sellerId: item.sellerId,
        sellerName: item.sellerName,
        title: item.title,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
        commissionRate: item.commissionPercent,
        commissionAmount: item.commissionAmount,
        sellerEarning: item.sellerEarning,
        platformProfit: item.platformProfit,
        orderStatus: "processing",
        paymentStatus: orderPayload.paymentStatus,
      }))
    );

    if (paymentMethod === "cod") {
      for (let item of enrichedItems) {
        if (item.productId) {
          await Product.findByIdAndUpdate(item.productId, {
            $inc: { totalStock: -item.quantity },
          });
        }
      }

      await Cart.findByIdAndDelete(cartId);

      const transaction = await Transaction.create({
        orderId: newlyCreatedOrder._id,
        userId,
        amount: newlyCreatedOrder.totalAmount,
        commissionAmount: sellerTotals.reduce((sum, s) => sum + s.commissionAmount, 0),
        sellerEarning: sellerTotals.reduce((sum, s) => sum + s.sellerEarning, 0),
        platformProfit: sellerTotals.reduce((sum, s) => sum + s.platformProfit, 0),
        provider: "cod",
        paymentMethod: "cod",
        status: "pending",
        details: { couponCode, giftCardCode, discountAmount },
      });
      newlyCreatedOrder.transactionId = transaction._id;
      await newlyCreatedOrder.save();

      return res.status(201).json({
        success: true,
        orderId: newlyCreatedOrder._id,
        message: "Order placed successfully via Cash on Delivery",
      });
    }

    res.status(201).json({
      success: true,
      orderId: newlyCreatedOrder._id,
      razorpayOrderId: newlyCreatedOrder.paymentId,
      amount: Math.round(Number(totalAmount || 0) * 100),
      currency: "INR",
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, message: "Some error occured!" });
  }
};

const capturePayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, orderId } = req.body;

    const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
    const generated_signature = hmac.digest("hex");

    if (generated_signature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed: Invalid signature",
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    order.paymentStatus = "paid";
    order.orderStatus = "processing";
    order.paymentId = razorpay_payment_id;
    order.payerId = razorpay_order_id;
    order.razorpaySignature = razorpay_signature;
    order.orderUpdateDate = new Date();
    await OrderItem.updateMany({ orderId: order._id }, { paymentStatus: "paid" });

    for (let item of order.cartItems) {
      if (item.productId) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { totalStock: -item.quantity },
        });
      }
    }

    await Cart.findByIdAndDelete(order.cartId);

    const transaction = await Transaction.create({
      orderId: order._id,
      userId: order.userId,
      amount: Number(order.totalAmount || 0),
      commissionAmount: order.sellerTotals.reduce((sum, seller) => sum + seller.commissionAmount, 0),
      sellerEarning: order.sellerTotals.reduce((sum, seller) => sum + seller.sellerEarning, 0),
      platformProfit: order.sellerTotals.reduce((sum, seller) => sum + seller.platformProfit, 0),
      provider: "razorpay",
      providerOrderId: razorpay_order_id,
      providerPaymentId: razorpay_payment_id,
      providerSignature: razorpay_signature,
      paymentMethod: "razorpay",
      status: "paid",
      details: {
        couponCode: order.couponCode,
        giftCardCode: order.giftCardCode,
        discountAmount: order.discountAmount,
      },
    });

    order.transactionId = transaction._id;
    await order.save();

    emitOrderUpdate(order);

    res.status(200).json({ success: true, message: "Order confirmed", data: order });
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, message: "Some error occured!" });
  }
};

const verifyRazorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    const signature = req.headers["x-razorpay-signature"];
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (!signature || expectedSignature !== signature) {
      return res.status(400).json({ success: false, message: "Invalid webhook signature" });
    }

    const event = JSON.parse(rawBody.toString("utf8"));
    const payment = event?.payload?.payment?.entity;

    if (event.event === "payment.captured" && payment?.order_id) {
      const order = await Order.findOne({ razorpayOrderId: payment.order_id });
      if (order) {
        order.paymentStatus = "paid";
        order.orderStatus = order.orderStatus === "pending" ? "processing" : order.orderStatus;
        order.paymentId = payment.id;
        order.payerId = payment.order_id;
        order.orderUpdateDate = new Date();
        await order.save();

        await OrderItem.updateMany({ orderId: order._id }, { paymentStatus: "paid" });

        await Transaction.findOneAndUpdate(
          { orderId: order._id, providerOrderId: payment.order_id },
          {
            orderId: order._id,
            userId: order.userId,
            amount: Number(order.totalAmount || 0),
            commissionAmount: order.sellerTotals.reduce((sum, seller) => sum + seller.commissionAmount, 0),
            sellerEarning: order.sellerTotals.reduce((sum, seller) => sum + seller.sellerEarning, 0),
            platformProfit: order.sellerTotals.reduce((sum, seller) => sum + seller.platformProfit, 0),
            provider: "razorpay",
            providerOrderId: payment.order_id,
            providerPaymentId: payment.id,
            paymentMethod: payment.method || "razorpay",
            status: "paid",
            details: payment,
          },
          { upsert: true, new: true }
        );

        emitOrderUpdate(order);
      }
    }

    return res.status(200).json({ success: true, message: "Webhook processed" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Webhook processing failed" });
  }
};

const getAllOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ userId }).sort({ orderDate: -1 });

    if (!orders.length) {
      return res.status(404).json({ success: false, message: "No orders found!" });
    }

    res.status(200).json({ success: true, data: orders });
  } catch (e) {
    res.status(500).json({ success: false, message: "Some error occured!" });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) return res.status(404).json({ success: false, message: "Order not found!" });

    res.status(200).json({ success: true, data: order });
  } catch (e) {
    res.status(500).json({ success: false, message: "Some error occured!" });
  }
};

const updateOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus, deliveredAt } = req.body;
    const normalizedStatus = normalizeOrderStatus(orderStatus);

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found!",
      });
    }

    if (normalizedStatus) {
      order.orderStatus = normalizedStatus;
    }

    if (deliveredAt) {
      order.deliveredAt = new Date(deliveredAt);
    }

    if (normalizedStatus === "delivered" && !order.deliveredAt) {
      order.deliveredAt = new Date();
    }

    order.orderUpdateDate = new Date();
    await order.save();

    emitOrderUpdate(order);

    res.status(200).json({
      success: true,
      data: order,
      message: "Order updated successfully",
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, message: "Some error occured!" });
  }
};

module.exports = {
  createOrder,
  capturePayment,
  verifyRazorpayWebhook,
  getAllOrdersByUser,
  getOrderDetails,
  updateOrderById,
};
