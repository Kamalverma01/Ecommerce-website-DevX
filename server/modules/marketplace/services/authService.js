const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const OtpVerification = require("../models/OtpVerification");
const { numericOtp } = require("../core/id");
const notificationService = require("./notificationService");

const accessSecret = () => process.env.JWT_ACCESS_SECRET || process.env.CLIENT_SECRET_KEY || "access-secret";
const refreshSecret = () => process.env.JWT_REFRESH_SECRET || process.env.CLIENT_REFRESH_SECRET || "refresh-secret";

function signAccessToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, accessSecret(), { expiresIn: "15m" });
}

function signRefreshToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, refreshSecret(), { expiresIn: "30d" });
}

async function registerCustomer(payload) {
  const hashedPassword = await bcrypt.hash(payload.password, 12);
  const user = await User.create({
    userName: payload.userName,
    email: payload.email,
    phone: payload.phone,
    password: hashedPassword,
    role: payload.role || "customer",
  });

  await issueOtp({ user, channel: "email", target: user.email, purpose: "auth" });
  return user;
}

async function login({ email, password, ip }) {
  const user = await User.findOne({ email }).select("+password +refreshTokenHash");
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error("Invalid email or password.");
  }

  const refreshToken = signRefreshToken(user);
  user.refreshTokenHash = await bcrypt.hash(refreshToken, 12);
  user.lastLoginIp = ip || "";
  await user.save();

  return {
    user: { id: user._id, email: user.email, role: user.role, userName: user.userName },
    accessToken: signAccessToken(user),
    refreshToken,
  };
}

async function refresh(refreshToken) {
  const payload = jwt.verify(refreshToken, refreshSecret());
  const user = await User.findById(payload.id).select("+refreshTokenHash");
  if (!user || !(await bcrypt.compare(refreshToken, user.refreshTokenHash || ""))) {
    throw new Error("Invalid refresh token.");
  }

  return { accessToken: signAccessToken(user) };
}

async function issueOtp({ user, channel, target, purpose }) {
  const otp = numericOtp();
  await OtpVerification.create({
    userId: user?._id || null,
    channel,
    target,
    purpose,
    otpHash: await bcrypt.hash(otp, 10),
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });

  await notificationService.queue({
    userId: user?._id,
    channel: channel === "sms" ? "sms" : "email",
    type: "otp",
    title: "Verification OTP",
    body: `Your verification OTP is ${otp}. It expires in 10 minutes.`,
  });

  return { target, channel, purpose };
}

async function verifyOtp({ target, purpose, otp }) {
  const record = await OtpVerification.findOne({
    target,
    purpose,
    verifiedAt: null,
    expiresAt: { $gt: new Date() },
  }).sort({ createdAt: -1 }).select("+otpHash");

  if (!record) {
    throw new Error("OTP expired or not found.");
  }

  record.attempts += 1;
  if (!(await bcrypt.compare(otp, record.otpHash))) {
    await record.save();
    throw new Error("Invalid OTP.");
  }

  record.verifiedAt = new Date();
  await record.save();

  await User.updateOne(
    { _id: record.userId },
    record.channel === "email" ? { emailVerified: true } : { phoneVerified: true }
  );

  return record;
}

module.exports = { registerCustomer, login, refresh, issueOtp, verifyOtp };
