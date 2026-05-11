const bcrypt = require("bcryptjs");
const OtpVerification = require("../../../models/OtpVerification");

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const MAX_RESEND_ATTEMPTS = 5;

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function createOtpRecord({ target, purpose }) {
  const recentAttemptCount = await OtpVerification.countDocuments({
    target,
    purpose,
    createdAt: { $gte: new Date(Date.now() - OTP_EXPIRY_MS) },
  });

  if (recentAttemptCount >= MAX_RESEND_ATTEMPTS) {
    const error = new Error("OTP resend limit reached. Please try later.");
    error.statusCode = 429;
    throw error;
  }

  const otp = generateOtp();
  const otpHash = await bcrypt.hash(otp, 10);

  const record = await OtpVerification.create({
    target,
    purpose,
    otpHash,
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
    verified: false,
  });

  return { record, otp };
}

async function verifyOtpRecord({ target, purpose, otpSessionId, otp }) {
  const record = await OtpVerification.findOne({
    _id: otpSessionId,
    target,
    purpose,
    expiresAt: { $gt: new Date() },
  });

  if (!record) return { ok: false, reason: "OTP expired or not found" };

  const matched = await bcrypt.compare(String(otp), record.otpHash);
  if (!matched) return { ok: false, reason: "Invalid OTP" };

  record.verified = true;
  await record.save();
  return { ok: true, record };
}

module.exports = {
  createOtpRecord,
  verifyOtpRecord,
  OTP_EXPIRY_MS,
  MAX_RESEND_ATTEMPTS,
};
