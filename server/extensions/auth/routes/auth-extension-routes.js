const express = require("express");
const controller = require("../controllers/auth-extension-controller");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", controller.register);
router.post("/send-otp", controller.sendOtp);
router.post("/verify-otp", controller.verifyOtp);
router.post("/login", controller.login);
router.post("/google", controller.loginWithGoogle);
router.post("/refresh", controller.refresh);
router.post("/forgot-password", controller.forgotPassword);
router.post("/reset-password", controller.resetPassword);
router.post("/logout", controller.logout);
router.post("/logout-all", authMiddleware, controller.logoutAllSessions);
router.get("/sessions", authMiddleware, controller.mySessions);

module.exports = router;
