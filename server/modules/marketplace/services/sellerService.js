const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Seller = require("../models/Seller");
const Wallet = require("../models/Wallet");
const Subscription = require("../models/Subscription");

const PLAN_LIMITS = {
  basic: { productLimit: 50, commissionReduction: 0 },
  pro: { productLimit: 250, commissionReduction: 2 },
  premium: { productLimit: 1000, commissionReduction: 5 },
};

async function registerSeller(payload) {
  const user = await User.create({
    userName: payload.userName,
    email: payload.email,
    phone: payload.phone,
    password: await bcrypt.hash(payload.password, 12),
    role: "seller",
  });

  const seller = await Seller.create({
    userId: user._id,
    businessName: payload.businessName,
    businessType: payload.businessType,
    supportEmail: payload.supportEmail || payload.email,
    phone: payload.phone,
    address: payload.address,
    kyc: payload.kyc,
  });

  await Wallet.create({ sellerId: seller._id });
  await Subscription.create({ sellerId: seller._id, ...PLAN_LIMITS.basic, plan: "basic" });

  return { user, seller };
}

async function approveSeller(sellerId, adminNote = "") {
  const seller = await Seller.findByIdAndUpdate(
    sellerId,
    { status: "approved", verifiedAt: new Date(), notes: adminNote },
    { new: true }
  );

  if (!seller) {
    throw new Error("Seller not found.");
  }

  return seller;
}

async function rejectSeller(sellerId, adminNote = "") {
  return Seller.findByIdAndUpdate(
    sellerId,
    { status: "rejected", rejectedAt: new Date(), notes: adminNote },
    { new: true }
  );
}

async function getVerifiedSellerByUser(userId) {
  const seller = await Seller.findOne({ userId });
  if (!seller || seller.status !== "approved") {
    throw new Error("Seller must be approved before using this feature.");
  }

  return seller;
}

module.exports = { registerSeller, approveSeller, rejectSeller, getVerifiedSellerByUser, PLAN_LIMITS };
