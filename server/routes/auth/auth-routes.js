const express = require("express");
const {
  registerUser,
  loginUser,
  loginWithGoogle,
  loginWithPhone,
  logoutUser,
  authMiddleware,
  checkAuthStatus,
  sendOtp,
  verifyOtp,
  changeEmail,
  changePhone,
  changePassword,
  updateProfile,
  getProfileSummary,
  testEmail,
  forgotPassword,
  resetPassword,
} = require("../../controllers/auth/auth-controller");

const { refreshToken } = require("../../controllers/auth/token-controller");

const router = express.Router();

// Auth endpoints
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/google", loginWithGoogle);
router.post("/phone", loginWithPhone);
router.post("/logout", logoutUser);

// Token refresh - can be called without authMiddleware since we check refreshToken cookie
router.post("/refresh", refreshToken);

// OTP endpoints
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);

// Forgot password endpoints
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected user endpoints
router.put("/change-email", authMiddleware, changeEmail);
router.put("/change-phone", authMiddleware, changePhone);
router.put("/change-password", authMiddleware, changePassword);
router.put("/profile", authMiddleware, updateProfile);
router.get("/profile", authMiddleware, getProfileSummary);
router.post("/test-email", authMiddleware, testEmail);
router.get("/check-auth", authMiddleware, checkAuthStatus);

module.exports = router;
