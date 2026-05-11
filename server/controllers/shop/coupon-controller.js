const Coupon = require("../../models/Coupon");

const createCoupon = async (req, res) => {
  try {
    const { code, discount, expiry, usageLimit } = req.body;
    if (!code || discount === undefined || !expiry) {
      return res.status(400).json({ success: false, message: "Code, discount, and expiry are required" });
    }

    const coupon = await Coupon.create({
      code: code.toUpperCase().trim(),
      discount,
      expiry,
      usageLimit: usageLimit || 1,
    });

    res.status(201).json({ success: true, data: coupon });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error creating coupon" });
  }
};

const applyCoupon = async (req, res) => {
  try {
    const { code, userId, cartTotal } = req.body;
    if (!code || !userId) {
      return res.status(400).json({ success: false, message: "Coupon code and user id are required" });
    }

    const coupon = await Coupon.findOne({ code: String(code).toUpperCase().trim() });

    if (!coupon) return res.status(404).json({ success: false, message: "Invalid coupon" });
    if (coupon.expiry < new Date()) return res.status(400).json({ success: false, message: "Coupon has expired" });
    if (coupon.usedBy.some((id) => id.toString() === userId)) {
      return res.status(400).json({ success: false, message: "Already used by you" });
    }
    if (coupon.usedBy.length >= coupon.usageLimit) {
      return res.status(400).json({ success: false, message: "Usage limit reached" });
    }

    const discountAmount = Math.min(Number(coupon.discount), Number(cartTotal || 0));
    
    // Note: Usually, we only push to usedBy AFTER the order is successfully placed.
    // For now, we follow your logic:
    coupon.usedBy.push(userId);
    await coupon.save();

    res.status(200).json({
      success: true,
      data: { code: coupon.code, discount: coupon.discount, discountAmount },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error applying coupon" });
  }
};

module.exports = { createCoupon, applyCoupon };