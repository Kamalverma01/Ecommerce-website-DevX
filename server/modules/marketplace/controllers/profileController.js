const asyncHandler = require("../core/asyncHandler");
const { success } = require("../core/apiResponse");
const Seller = require("../models/Seller");
const Wallet = require("../models/Wallet");
const Commission = require("../models/Commission");
const AppUser = require("../../../models/User");
const AppSeller = require("../../../models/Seller");
const AppOrder = require("../../../models/Order");

const me = asyncHandler(async (req, res) => {
  const profile = {
    user: {
      id: req.user._id,
      userName: req.user.userName,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
      emailVerified: req.user.emailVerified,
      phoneVerified: req.user.phoneVerified,
      createdAt: req.user.createdAt,
    },
    seller: null,
    wallet: null,
    commission: null,
  };

  if (req.user.role === "seller") {
    const appSeller = await AppSeller.findOne({ userId: req.user._id });
    if (appSeller) {
      const orders = await AppOrder.find({ "sellerTotals.sellerId": req.user._id });
      const totals = orders.flatMap((order) =>
        (order.sellerTotals || []).filter((total) => String(total.sellerId) === String(req.user._id))
      );
      const commissionDeducted = totals.reduce((sum, total) => sum + Number(total.commissionAmount || 0), 0);
      const totalEarnings = totals.reduce((sum, total) => sum + Number(total.sellerEarning || 0), 0);
      profile.seller = appSeller;
      profile.wallet = {
        totalEarnings,
        commissionDeducted,
        availableBalance: totalEarnings,
      };
      profile.commission = [
        { _id: "earned", total: commissionDeducted, count: totals.length },
      ];
      return success(res, "Profile fetched.", profile);
    }

    const seller = await Seller.findOne({ userId: req.user._id });
    const wallet = seller ? await Wallet.findOne({ sellerId: seller._id }) : null;
    const commission = seller
      ? await Commission.aggregate([
          { $match: { sellerId: seller._id } },
          {
            $group: {
              _id: "$status",
              total: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
        ])
      : [];

    profile.seller = seller;
    profile.wallet = wallet;
    profile.commission = commission;
  }

  return success(res, "Profile fetched.", profile);
});

const updateMe = asyncHandler(async (req, res) => {
  const user = await AppUser.findById(req.user._id);
  if (user && req.body.email && req.body.email !== user.email) {
    const duplicate = await AppUser.findOne({ email: String(req.body.email).trim().toLowerCase(), _id: { $ne: user._id } });
    if (duplicate) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }
    user.email = String(req.body.email).trim().toLowerCase();
    user.emailVerified = false;
  }
  if (user && req.body.phone && req.body.phone !== user.phone) {
    const normalizedPhone = String(req.body.phone).replace(/\D/g, "");
    const duplicate = await AppUser.findOne({ phone: normalizedPhone, _id: { $ne: user._id } });
    if (duplicate) {
      return res.status(400).json({ success: false, message: "Phone number already exists" });
    }
    user.phone = normalizedPhone;
    user.phoneVerified = false;
  }
  if (user && req.body.userName) {
    user.userName = String(req.body.userName).trim();
  }
  if (user) {
    await user.save();
    req.user = user;
  } else {
    const allowedUserFields = ["userName", "phone"];
    allowedUserFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        req.user[field] = req.body[field];
      }
    });
    await req.user.save();
  }

  if (req.user.role === "seller" && req.body.seller) {
    await AppSeller.updateOne(
      { userId: req.user._id },
      {
        $set: {
          businessName: req.body.seller.businessName,
          businessType: req.body.seller.businessType,
          supportEmail: req.body.seller.supportEmail,
          phone: req.body.seller.phone,
          address: req.body.seller.address,
        },
      }
    );
    await Seller.updateOne(
      { userId: req.user._id },
      {
        $set: {
          businessName: req.body.seller.businessName,
          businessType: req.body.seller.businessType,
          supportEmail: req.body.seller.supportEmail,
          phone: req.body.seller.phone,
          address: req.body.seller.address,
        },
      }
    );
  }

  return success(res, "Profile updated.", {
    user: {
      id: req.user._id,
      userName: req.user.userName,
      email: req.user.email,
      phone: req.user.phone,
      role: req.user.role,
    },
  });
});

const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token");
  res.clearCookie("accessToken");
  return success(res, "Logged out successfully.");
});

module.exports = { me, updateMe, logout };
