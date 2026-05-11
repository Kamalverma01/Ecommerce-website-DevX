const bcrypt = require("bcryptjs");
const User = require("../../../models/User");
const { verifyFirebaseToken } = require("../../../helpers/firebase-admin");
const { sendMail } = require("../../../helpers/mailer");
const { sendSmsOtp } = require("../../../helpers/twilio-whatsapp");
const { createOtpRecord, verifyOtpRecord } = require("../services/otp-service");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  setAuthCookies,
  buildAuthPayload,
} = require("../services/jwt-service");
const {
  createSession,
  getSession,
  touchSession,
  invalidateSession,
  invalidateAllUserSessions,
  listUserSessions,
} = require("../services/session-service");

function normalizeEmail(value = "") {
  return String(value).trim().toLowerCase();
}

function normalizePhone(value = "") {
  return String(value).replace(/\D/g, "");
}

function isEmail(value = "") {
  return String(value).includes("@");
}

async function register(req, res) {
  const { name, email, phone, password } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(phone);

  if (!name || !password || (!normalizedEmail && !normalizedPhone)) {
    return res.status(400).json({ success: false, message: "Missing required fields" });
  }

  const duplicate = await User.findOne({
    $or: [normalizedEmail ? { email: normalizedEmail } : null, normalizedPhone ? { phone: normalizedPhone } : null].filter(Boolean),
  });
  if (duplicate) {
    return res.status(400).json({ success: false, message: "Email or phone already exists" });
  }

  const hash = await bcrypt.hash(password, 12);
  const user = await User.create({
    userName: name,
    email: normalizedEmail || `placeholder+${Date.now()}@example.com`,
    phone: normalizedPhone || `000000${Date.now()}`.slice(-10),
    password: hash,
    role: "user",
    emailVerified: false,
    phoneVerified: false,
  });

  return res.status(201).json({
    success: true,
    user: {
      name: user.userName,
      email: user.email,
      phone: user.phone,
      role: user.role === "user" ? "customer" : user.role,
      avatar: user.profileImage || "",
      isVerified: Boolean(user.emailVerified || user.phoneVerified),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
}

async function sendOtp(req, res) {
  const { target, purpose = "register" } = req.body;
  const normalizedTarget = isEmail(target) ? normalizeEmail(target) : normalizePhone(target);
  const { record, otp } = await createOtpRecord({ target: normalizedTarget, purpose });

  if (isEmail(normalizedTarget)) {
    await sendMail({
      to: normalizedTarget,
      subject: "Verification OTP",
      text: `Your OTP is ${otp}.`,
    });
  } else {
    await sendSmsOtp({ to: normalizedTarget, otp });
  }

  return res.status(200).json({
    success: true,
    message: "OTP sent",
    otpSessionId: record._id,
    devOtp: process.env.NODE_ENV === "production" ? undefined : otp,
  });
}

async function verifyOtp(req, res) {
  const { target, otp, purpose = "register", otpSessionId } = req.body;
  const normalizedTarget = isEmail(target) ? normalizeEmail(target) : normalizePhone(target);
  const result = await verifyOtpRecord({ target: normalizedTarget, purpose, otpSessionId, otp });
  if (!result.ok) return res.status(400).json({ success: false, message: result.reason });
  return res.status(200).json({ success: true, otpSessionId: result.record._id, message: "OTP verified" });
}

async function login(req, res) {
  const { identifier, password, rememberMe = false } = req.body;
  const normalized = isEmail(identifier) ? normalizeEmail(identifier) : normalizePhone(identifier);
  const user = await User.findOne(isEmail(identifier) ? { email: normalized } : { phone: normalized });
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  const matched = await bcrypt.compare(password, user.password || "");
  if (!matched) return res.status(400).json({ success: false, message: "Invalid credentials" });

  const session = createSession({
    userId: user._id,
    rememberMe,
    userAgent: req.headers["user-agent"] || "",
    ip: req.ip,
  });
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user, session.id);
  setAuthCookies(res, accessToken, refreshToken, rememberMe);

  return res.status(200).json({ success: true, user: buildAuthPayload(user), accessToken });
}

async function loginWithGoogle(req, res) {
  const { googleToken, rememberMe = true } = req.body;
  const decoded = await verifyFirebaseToken(googleToken);
  const email = normalizeEmail(decoded.email);
  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({
      userName: decoded.name || "Google User",
      email,
      phone: `000000${Date.now()}`.slice(-10),
      password: "",
      role: "user",
      authProvider: "google",
      googleId: decoded.uid,
      emailVerified: Boolean(decoded.email_verified),
    });
  }

  const session = createSession({ userId: user._id, rememberMe, userAgent: req.headers["user-agent"] || "", ip: req.ip });
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user, session.id);
  setAuthCookies(res, accessToken, refreshToken, rememberMe);

  return res.status(200).json({ success: true, user: buildAuthPayload(user), accessToken });
}

async function refresh(req, res) {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    const decoded = verifyRefreshToken(token);
    const session = getSession(decoded.sessionId);
    if (!session) return res.status(401).json({ success: false, message: "Invalid refresh session" });

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: "User not found" });

    touchSession(session.id);
    const accessToken = signAccessToken(user);
    const nextRefreshToken = signRefreshToken(user, session.id);
    setAuthCookies(res, accessToken, nextRefreshToken, true);
    return res.status(200).json({ success: true, accessToken, user: buildAuthPayload(user) });
  } catch (error) {
    return res.status(401).json({ success: false, message: "Refresh failed" });
  }
}

async function forgotPassword(req, res) {
  const { identifier } = req.body;
  const normalized = isEmail(identifier) ? normalizeEmail(identifier) : normalizePhone(identifier);
  const user = await User.findOne(isEmail(identifier) ? { email: normalized } : { phone: normalized });
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  const { record, otp } = await createOtpRecord({ target: normalized, purpose: "forgot-password" });
  if (isEmail(normalized)) {
    await sendMail({
      to: normalized,
      subject: "Password reset OTP",
      text: `Reset OTP: ${otp}`,
    });
  } else {
    await sendSmsOtp({ to: normalized, otp });
  }

  return res.status(200).json({
    success: true,
    otpSessionId: record._id,
    devOtp: process.env.NODE_ENV === "production" ? undefined : otp,
  });
}

async function resetPassword(req, res) {
  const { identifier, otp, otpSessionId, newPassword } = req.body;
  const normalized = isEmail(identifier) ? normalizeEmail(identifier) : normalizePhone(identifier);

  const verified = await verifyOtpRecord({
    target: normalized,
    purpose: "forgot-password",
    otpSessionId,
    otp,
  });
  if (!verified.ok) return res.status(400).json({ success: false, message: verified.reason });

  const user = await User.findOne(isEmail(identifier) ? { email: normalized } : { phone: normalized });
  if (!user) return res.status(404).json({ success: false, message: "User not found" });

  user.password = await bcrypt.hash(newPassword, 12);
  await user.save();
  invalidateAllUserSessions(user._id);

  return res.status(200).json({ success: true, message: "Password updated successfully" });
}

async function logout(req, res) {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      const decoded = verifyRefreshToken(refreshToken);
      if (decoded?.sessionId) invalidateSession(decoded.sessionId);
    }
  } catch (error) {
    // Ignore decode errors and still clear cookies.
  }

  res.clearCookie("token");
  res.clearCookie("refreshToken");
  return res.status(200).json({ success: true, message: "Logged out" });
}

async function logoutAllSessions(req, res) {
  invalidateAllUserSessions(req.user.id);
  res.clearCookie("token");
  res.clearCookie("refreshToken");
  return res.status(200).json({ success: true, message: "Logged out from all devices" });
}

async function mySessions(req, res) {
  const sessions = listUserSessions(req.user.id);
  return res.status(200).json({ success: true, data: sessions });
}

module.exports = {
  register,
  sendOtp,
  verifyOtp,
  login,
  loginWithGoogle,
  refresh,
  forgotPassword,
  resetPassword,
  logout,
  logoutAllSessions,
  mySessions,
};
