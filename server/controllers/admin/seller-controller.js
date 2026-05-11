const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const Seller = require("../../models/Seller");
const User = require("../../models/User");
const { sendMail } = require("../../helpers/mailer");
const { setPlatformSetting, getPlatformSetting } = require("../../utils/platform-settings");

function createTemporaryPassword() {
  return `Seller@${crypto.randomBytes(4).toString("hex")}`;
}

async function sendSellerApprovalEmail({ user, seller, temporaryPassword }) {
  const loginUrl = process.env.FRONTEND_URL || "http://localhost:5173/auth/login";
  const hasTemporaryPassword = Boolean(temporaryPassword);
  const text = hasTemporaryPassword
    ? `Your seller account for ${seller.businessName} has been approved.\n\nLogin URL: ${loginUrl}\nEmail: ${user.email}\nTemporary password: ${temporaryPassword}\n\nPlease change this temporary password after logging in.`
    : `Your seller account for ${seller.businessName} has been approved.\n\nLogin URL: ${loginUrl}\nEmail: ${user.email}\n\nUse your existing password to log in.`;

  const html = hasTemporaryPassword
    ? `<p>Your seller account for <strong>${seller.businessName}</strong> has been approved.</p><p><strong>Login URL:</strong> ${loginUrl}</p><p><strong>Email:</strong> ${user.email}</p><p><strong>Temporary password:</strong> ${temporaryPassword}</p><p>Please change this temporary password after logging in.</p>`
    : `<p>Your seller account for <strong>${seller.businessName}</strong> has been approved.</p><p><strong>Login URL:</strong> ${loginUrl}</p><p><strong>Email:</strong> ${user.email}</p><p>Use your existing password to log in.</p>`;

  return sendMail({
    to: user.email,
    subject: "Your seller account has been approved",
    text,
    html,
  });
}

const listSellerApplications = async (req, res) => {
  try {
    const applications = await Seller.find({}).populate("userId", "userName email phone role");
    return res.status(200).json({ success: true, data: applications });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to fetch seller applications" });
  }
};

const getSellerDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Seller.findById(id).populate("userId", "userName email phone role");
    if (!application) {
      return res.status(404).json({ success: false, message: "Seller application not found" });
    }
    return res.status(200).json({ success: true, data: application });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to fetch seller details" });
  }
};

const approveSeller = async (req, res) => {
  try {
    const { id } = req.params;
    const seller = await Seller.findById(id);
    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller application not found" });
    }

    if (seller.status === "approved") {
      return res.status(400).json({ success: false, message: "Seller application is already approved" });
    }

    const user = await User.findById(seller.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Seller user account not found" });
    }

    const shouldIssueTemporaryPassword = !user.password || req.body?.issueTemporaryPassword === true;
    const temporaryPassword = shouldIssueTemporaryPassword ? createTemporaryPassword() : "";

    if (temporaryPassword) {
      user.password = await bcrypt.hash(temporaryPassword, 12);
      user.mustChangePassword = true;
      user.temporaryPasswordIssuedAt = new Date();
    }

    if (!user.phone && seller.phone) {
      user.phone = seller.phone;
      user.phoneVerified = user.phoneVerified || false;
    }

    user.role = "seller";
    await user.save();

    seller.status = "approved";
    seller.approvedAt = new Date();
    seller.rejectedAt = null;
    await seller.save();

    const emailResult = await sendSellerApprovalEmail({
      user,
      seller,
      temporaryPassword,
    });

    return res.status(200).json({
      success: true,
      data: seller,
      message: temporaryPassword
        ? "Seller approved and temporary password email sent"
        : "Seller approved and login email sent",
      email: {
        sent: !emailResult?.skipped,
        skipped: Boolean(emailResult?.skipped),
        reason: emailResult?.reason,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to approve seller" });
  }
};

const rejectSeller = async (req, res) => {
  try {
    const { id } = req.params;
    const seller = await Seller.findById(id);
    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller application not found" });
    }

    seller.status = "rejected";
    seller.rejectedAt = new Date();
    await seller.save();

    await User.findByIdAndUpdate(seller.userId, { role: "user" });

    return res.status(200).json({ success: true, data: seller });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to reject seller" });
  }
};

const updateSellerCommissionOverride = async (req, res) => {
  try {
    const { id } = req.params;
    const { commissionOverride } = req.body;
    const seller = await Seller.findById(id);
    if (!seller) {
      return res.status(404).json({ success: false, message: "Seller not found" });
    }

    seller.commissionOverride = Number(commissionOverride) || null;
    await seller.save();

    return res.status(200).json({ success: true, data: seller });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to update seller commission" });
  }
};

const setGlobalCommission = async (req, res) => {
  try {
    const { commissionPercent } = req.body;
    if (typeof commissionPercent === "undefined") {
      return res.status(400).json({ success: false, message: "commissionPercent is required" });
    }

    const value = Number(commissionPercent);
    await setPlatformSetting("globalCommissionPercent", value);
    return res.status(200).json({ success: true, data: { globalCommissionPercent: value } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to set global commission" });
  }
};

const getCommissionSettings = async (req, res) => {
  try {
    const current = await getPlatformSetting("globalCommissionPercent", 10);
    return res.status(200).json({ success: true, data: { globalCommissionPercent: current } });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Unable to fetch commission settings" });
  }
};

module.exports = {
  listSellerApplications,
  getSellerDetails,
  approveSeller,
  rejectSeller,
  updateSellerCommissionOverride,
  setGlobalCommission,
  getCommissionSettings,
};
