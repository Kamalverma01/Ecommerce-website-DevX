const jwt = require("jsonwebtoken");

const ACCESS_SECRET = process.env.JWT_SECRET || "CLIENT_SECRET_KEY";
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || "REFRESH_SECRET_KEY";

const ACCESS_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

function buildAuthPayload(user) {
  return {
    id: String(user._id),
    name: user.userName || user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    role: user.role || "customer",
    avatar: user.profileImage || user.avatar || "",
    isVerified: Boolean(user.emailVerified || user.isVerified),
  };
}

function signAccessToken(user) {
  return jwt.sign(buildAuthPayload(user), ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
}

function signRefreshToken(user, sessionId) {
  return jwt.sign({ ...buildAuthPayload(user), sessionId }, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES_IN,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

function setAuthCookies(res, accessToken, refreshToken, rememberMe = false) {
  const accessMaxAge = 15 * 60 * 1000;
  const refreshMaxAge = rememberMe ? 7 * 24 * 60 * 60 * 1000 : undefined;

  res.cookie("token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: accessMaxAge,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: refreshMaxAge,
  });
}

module.exports = {
  buildAuthPayload,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  setAuthCookies,
  ACCESS_EXPIRES_IN,
  REFRESH_EXPIRES_IN,
};
