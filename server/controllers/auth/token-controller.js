/**
 * Token Management Controller
 * Handles access token and refresh token generation and validation
 */

const jwt = require("jsonwebtoken");
const User = require("../../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "CLIENT_SECRET_KEY";
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "REFRESH_SECRET_KEY";

// Token expiry times
const ACCESS_TOKEN_EXPIRY = "15m";      // Short-lived access token
const REFRESH_TOKEN_EXPIRY = "7d";      // Long-lived refresh token
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

/**
 * Generate user payload for JWT
 * 
 * @param {Object} user - MongoDB User document
 * @returns {Object} User payload for JWT
 */
function buildUserPayload(user) {
  return {
    id: String(user._id),
    email: user.email,
    phone: user.phone,
    role: user.role,
    userName: user.userName,
    address: user.address || "",
    profileImage: user.profileImage || "",
    authProvider: user.authProvider,
    phoneVerified: user.phoneVerified,
    emailVerified: user.emailVerified,
    mustChangePassword: Boolean(user.mustChangePassword),
  };
}

/**
 * Generate access token (short-lived)
 * 
 * @param {Object} user - MongoDB User document
 * @returns {string} Signed JWT access token
 */
function generateAccessToken(user) {
  return jwt.sign(buildUserPayload(user), JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

/**
 * Generate refresh token (long-lived)
 * Stored in HTTP-only cookie for security
 * 
 * @param {Object} user - MongoDB User document
 * @returns {string} Signed JWT refresh token
 */
function generateRefreshToken(user) {
  return jwt.sign(buildUserPayload(user), REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

/**
 * Set refresh token in HTTP-only cookie
 * 
 * @param {Object} res - Express response object
 * @param {string} token - Refresh token
 * @param {boolean} rememberMe - If true, uses longer cookie expiry
 */
function setRefreshTokenCookie(res, token, rememberMe = false) {
  const maxAge = rememberMe ? COOKIE_MAX_AGE : undefined; // Session cookie if no remember me
  
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge, // undefined = session cookie, number = persistent cookie
  });
}

/**
 * Set access token in HTTP-only cookie (optional, can also send in response)
 * 
 * @param {Object} res - Express response object
 * @param {string} token - Access token
 */
function setAccessTokenCookie(res, token) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
}

/**
 * Refresh access token using refresh token
 * 
 * Endpoint: POST /api/auth/refresh
 * Cookies: refreshToken (required)
 * 
 * @returns {Object} Success response with new tokens
 */
const refreshToken = async (req, res) => {
  try {
    const refreshTokenCookie = req.cookies.refreshToken;

    if (!refreshTokenCookie) {
      return res.status(401).json({
        success: false,
        message: "Refresh token not found. Please login again.",
        code: "NO_REFRESH_TOKEN",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshTokenCookie, REFRESH_TOKEN_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        // Clear invalid refresh token
        res.clearCookie("refreshToken");
        return res.status(401).json({
          success: false,
          message: "Refresh token expired. Please login again.",
          code: "REFRESH_TOKEN_EXPIRED",
        });
      }
      throw error;
    }

    // Verify user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      res.clearCookie("refreshToken");
      res.clearCookie("token");
      return res.status(401).json({
        success: false,
        message: "User no longer exists.",
        code: "USER_NOT_FOUND",
      });
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Update refresh token cookie
    setRefreshTokenCookie(res, newRefreshToken, true);

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
      user: buildUserPayload(user),
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error refreshing token",
    });
  }
};

/**
 * Initialize auth tokens after successful login
 * Generates and sets both access and refresh tokens
 * 
 * @param {Object} res - Express response object
 * @param {Object} user - MongoDB User document
 * @param {boolean} rememberMe - If true, sets persistent refresh token cookie
 * @param {string} message - Response message
 * @returns {Object} JSON response with tokens and user info
 */
function sendAuthResponse(res, user, rememberMe = false, message = "Logged in successfully") {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Set both tokens in cookies
  setAccessTokenCookie(res, accessToken);
  setRefreshTokenCookie(res, refreshToken, rememberMe);

  return res.status(200).json({
    success: true,
    message,
    accessToken,
    user: buildUserPayload(user),
  });
}

/**
 * Logout - clear auth cookies
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const logoutUser = (req, res) => {
  try {
    res.clearCookie("token");
    res.clearCookie("refreshToken");

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "Error during logout",
    });
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  refreshToken,
  sendAuthResponse,
  logoutUser,
  buildUserPayload,
  setAccessTokenCookie,
  setRefreshTokenCookie,
  REFRESH_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
};
