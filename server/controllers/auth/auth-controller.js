const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const Seller = require("../../models/Seller");
const OtpVerification = require("../../models/OtpVerification");
const Address = require("../../models/Address");
const Order = require("../../models/Order");
const Wishlist = require("../../models/Wishlist");
const Coupon = require("../../models/Coupon");
const ProductReview = require("../../models/Review");
const { sendMail } = require("../../helpers/mailer");
const { sendSmsOtp, sendWhatsappOtp } = require("../../helpers/twilio-whatsapp");
const { verifyFirebaseToken } = require("../../helpers/firebase-admin");
const { isDisposableEmail } = require("../../utils/disposable-email-domains");
const { sendAuthResponse, logoutUser: tokenLogoutUser } = require("./token-controller");

const JWT_SECRET = process.env.JWT_SECRET || "CLIENT_SECRET_KEY";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function createOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function normalizeEmail(email = "") {
  return String(email).trim().toLowerCase();
}

function normalizePhone(phone = "") {
  return String(phone).replace(/\D/g, "");
}

function validateEmailFormat(email = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

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

function isEmailLike(value = "") {
  return String(value).includes("@");
}

async function validateOtpSession({ target, purpose, otpSessionId }) {
  if (!otpSessionId) return false;

  const otpRecord = await OtpVerification.findOne({
    _id: otpSessionId,
    target,
    purpose,
    verified: true,
    expiresAt: { $gt: new Date() },
  });

  return Boolean(otpRecord);
}

async function ensureNoDuplicateUser({ email, phone, ignoreUserId = null }) {
  const clauses = [];

  if (email) {
    clauses.push({ email });
  }

  if (phone) {
    clauses.push({ phone });
  }

  if (!clauses.length) return null;

  const query = { $or: clauses };
  if (ignoreUserId) {
    query._id = { $ne: ignoreUserId };
  }

  const existingUser = await User.findOne(query);
  if (!existingUser) return null;

  if (email && existingUser.email === email) {
    return "An account with this email already exists";
  }

  if (phone && existingUser.phone === phone) {
    return "An account with this phone number already exists";
  }

  return "Duplicate account detected";
}

async function requireVerifiedPhoneToken(firebaseIdToken, expectedPhone) {
  if (!firebaseIdToken) {
    throw new Error("Phone verification token is required");
  }

  const decoded = await verifyFirebaseToken(firebaseIdToken);
  const verifiedPhone = normalizePhone(decoded.phone_number || "");

  if (!verifiedPhone || verifiedPhone !== normalizePhone(expectedPhone)) {
    throw new Error("Phone verification failed");
  }

  return decoded;
}

async function getAuthenticatedUser(userId) {
  return User.findById(userId);
}

/**
 * Forgot Password - Send OTP to email or phone
 */
const forgotPassword = async (req, res) => {
  try {
    const { email, phone, channel = "email" } = req.body;
    
    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: "Email or phone is required",
      });
    }

    const target = email || phone;
    const normalizedTarget = email ? normalizeEmail(email) : normalizePhone(phone);

    // Find user by email or phone
    const user = await User.findOne({
      $or: [
        { email: normalizedTarget },
        { phone: normalizedTarget },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User with this email or phone not found",
      });
    }

    // Send OTP
    const otp = createOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const record = await OtpVerification.create({
      target: normalizedTarget,
      purpose: "forgot-password",
      otpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    // Send via email or SMS
    if (email || normalizedTarget.includes("@")) {
      await sendMail({
        to: normalizedTarget,
        subject: "Password Reset OTP",
        text: `Your OTP for password reset is ${otp}. It expires in 10 minutes.`,
        html: `<p>Your OTP for password reset is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
      });
    } else {
      await sendSmsOtp({
        to: normalizedTarget,
        otp,
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      otpSessionId: record._id,
      devOtp: process.env.NODE_ENV === "production" ? undefined : otp,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error sending password reset OTP",
    });
  }
};

/**
 * Reset Password - Verify OTP and set new password
 */
const resetPassword = async (req, res) => {
  try {
    const { email, phone, otp, newPassword, otpSessionId } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password is required",
      });
    }

    const target = email || phone;
    const normalizedTarget = email ? normalizeEmail(email) : normalizePhone(phone);

    if (!normalizedTarget) {
      return res.status(400).json({
        success: false,
        message: "Email or phone is required",
      });
    }

    // Verify OTP
    const record = await OtpVerification.findOne({
      _id: otpSessionId,
      target: normalizedTarget,
      purpose: "forgot-password",
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or not found",
      });
    }

    const isMatch = await bcrypt.compare(String(otp), record.otpHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // Find user and update password
    const user = await User.findOne({
      $or: [
        { email: normalizedTarget },
        { phone: normalizedTarget },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Hash and save new password
    const hashPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashPassword;
    user.mustChangePassword = false;
    user.temporaryPasswordIssuedAt = null;
    await user.save();

    // Mark OTP as used
    record.verified = true;
    await record.save();

    // Send confirmation email
    await sendMail({
      to: user.email,
      subject: "Password Reset Successful",
      text: "Your password was reset successfully.",
      html: "<p>Your password was reset successfully.</p>",
    });

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Error resetting password",
    });
  }
};

const registerUser = async (req, res) => {
  const {
    userName,
    email,
    password,
    phone,
    address = "",
    otpSessionId,
    phoneOtpSessionId,
  } = req.body;

  try {
    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhone(phone);

    if (!userName || !normalizedEmail || !password || !normalizedPhone) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password and verified phone are required",
      });
    }

    if (!validateEmailFormat(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address",
      });
    }

    if (isDisposableEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Disposable email addresses are not allowed",
      });
    }

    const duplicateMessage = await ensureNoDuplicateUser({
      email: normalizedEmail,
      phone: normalizedPhone,
    });

    if (duplicateMessage) {
      return res.status(400).json({
        success: false,
        message: duplicateMessage,
      });
    }

    const isOtpVerified = await validateOtpSession({
      target: normalizedEmail,
      purpose: "register",
      otpSessionId,
    });

    if (!isOtpVerified) {
      return res.status(400).json({
        success: false,
        message: "Please verify your email OTP before signing up",
      });
    }

    const isPhoneOtpVerified = await validateOtpSession({
      target: normalizedPhone,
      purpose: "register",
      otpSessionId: phoneOtpSessionId,
    });

    if (!isPhoneOtpVerified) {
      return res.status(400).json({
        success: false,
        message: "Please verify your phone OTP before signing up",
      });
    }

    const hashPassword = await bcrypt.hash(password, 12);
    const newUser = await User.create({
      userName: userName.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      password: hashPassword,
      address: String(address).trim(),
      authProvider: "email",
      phoneVerified: true,
      emailVerified: true,
    });

    return res.status(200).json({
      success: true,
      message: "Registration successful",
      user: buildUserPayload(newUser),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message || "Some error occurred",
    });
  }
};

const loginUser = async (req, res) => {
  const { identifier, email, phone, password, rememberMe = false } = req.body;

  try {
    const rawIdentifier = identifier || email || phone || "";
    const checkUser = await User.findOne(
      isEmailLike(rawIdentifier)
        ? { email: normalizeEmail(rawIdentifier) }
        : { phone: normalizePhone(rawIdentifier) }
    );

    if (!checkUser) {
      return res.status(404).json({
        success: false,
        message: "User doesn't exist. Please register first",
      });
    }

    if (!checkUser.password) {
      return res.status(400).json({
        success: false,
        message: "This account uses Google or phone sign-in. Use that method instead.",
      });
    }

    const checkPasswordMatch = await bcrypt.compare(password, checkUser.password);
    if (!checkPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect password. Please try again",
      });
    }

    return sendAuthResponse(res, checkUser, rememberMe, "Login successful");
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Some error occurred",
    });
  }
};

const loginWithGoogle = async (req, res) => {
  try {
    const {
      firebaseIdToken,
      userName,
      phone,
      address = "",
      phoneOtpSessionId,
      rememberMe = false,
    } = req.body;

    if (!firebaseIdToken) {
      return res.status(400).json({
        success: false,
        message: "Google token is required",
      });
    }

    const decoded = await verifyFirebaseToken(firebaseIdToken);
    const normalizedEmail = normalizeEmail(decoded.email);

    if (!decoded.email || !decoded.name) {
      return res.status(400).json({
        success: false,
        message: "Google account must include name and email",
      });
    }

    if (isDisposableEmail(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Disposable email addresses are not allowed",
      });
    }

    let user = await User.findOne({
      $or: [{ email: normalizedEmail }, { googleId: decoded.uid }],
    });

    if (!user) {
      if (!phone || !phoneOtpSessionId) {
        return res.status(200).json({
          success: false,
          profileCompletionRequired: true,
          message: "Phone verification is required to finish Google signup",
          profile: {
            userName: decoded.name,
            email: normalizedEmail,
          },
        });
      }

      const normalizedPhone = normalizePhone(phone);
      const duplicateMessage = await ensureNoDuplicateUser({
        email: normalizedEmail,
        phone: normalizedPhone,
      });

      if (duplicateMessage) {
        return res.status(400).json({
          success: false,
          message: duplicateMessage,
        });
      }

      const isPhoneOtpVerified = await validateOtpSession({
        target: normalizedPhone,
        purpose: "register",
        otpSessionId: phoneOtpSessionId,
      });

      if (!isPhoneOtpVerified) {
        return res.status(400).json({
          success: false,
          message: "Verify your phone OTP before continuing",
        });
      }

      user = await User.create({
        userName: String(userName || decoded.name).trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        password: "",
        address: String(address).trim(),
        authProvider: "google",
        firebaseUid: decoded.uid,
        googleId: decoded.uid,
        phoneVerified: true,
        emailVerified: Boolean(decoded.email_verified),
      });
    } else {
      const hasVerifiedPhone = Boolean(user.phoneVerified && normalizePhone(user.phone));

      if (!hasVerifiedPhone) {
        if (!phone || !phoneOtpSessionId) {
          return res.status(200).json({
            success: false,
            profileCompletionRequired: true,
            message: "Phone verification is required to finish Google signup",
            profile: {
              userName: user.userName || decoded.name,
              email: normalizedEmail,
              phone: user.phoneVerified ? user.phone : "",
            },
          });
        }

        const normalizedPhone = normalizePhone(phone);
        const duplicateMessage = await ensureNoDuplicateUser({
          phone: normalizedPhone,
          ignoreUserId: user._id,
        });

        if (duplicateMessage) {
          return res.status(400).json({
            success: false,
            message: duplicateMessage,
          });
        }

        const isPhoneOtpVerified = await validateOtpSession({
          target: normalizedPhone,
          purpose: "register",
          otpSessionId: phoneOtpSessionId,
        });

        if (!isPhoneOtpVerified) {
          return res.status(400).json({
            success: false,
            message: "Verify your phone OTP before continuing",
          });
        }

        user.phone = normalizedPhone;
        user.phoneVerified = true;
      }

      const nextUserName = String(userName || user.userName || decoded.name).trim();
      if (nextUserName) {
        user.userName = nextUserName;
      }

      if (!user.googleId) {
        user.googleId = decoded.uid;
      }

      if (!user.emailVerified && decoded.email_verified) {
        user.emailVerified = true;
      }

      if (!user.authProvider) {
        user.authProvider = "google";
      }

      await user.save();
    }

    return sendAuthResponse(res, user, rememberMe, "Google sign-in successful");
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message || "Google authentication failed",
    });
  }
};

const loginWithPhone = async (req, res) => {
  try {
    const { firebaseIdToken, email, userName, address = "", otpSessionId, rememberMe = false } = req.body;

    if (!firebaseIdToken) {
      return res.status(400).json({
        success: false,
        message: "Phone token is required",
      });
    }

    const decoded = await verifyFirebaseToken(firebaseIdToken);
    const normalizedPhone = normalizePhone(decoded.phone_number || "");

    if (!normalizedPhone) {
      return res.status(400).json({
        success: false,
        message: "Verified phone number not found",
      });
    }

    let user = await User.findOne({
      $or: [{ phone: normalizedPhone }, { firebaseUid: decoded.uid }],
    });

    if (!user) {
      const normalizedEmail = normalizeEmail(email);

      if (!normalizedEmail || !userName) {
        return res.status(200).json({
          success: false,
          registrationRequired: true,
          message: "Complete your profile to finish phone registration",
          profile: {
            phone: normalizedPhone,
          },
        });
      }

      if (!validateEmailFormat(normalizedEmail)) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid email address",
        });
      }

      if (isDisposableEmail(normalizedEmail)) {
        return res.status(400).json({
          success: false,
          message: "Disposable email addresses are not allowed",
        });
      }

      const duplicateMessage = await ensureNoDuplicateUser({
        email: normalizedEmail,
        phone: normalizedPhone,
      });

      if (duplicateMessage) {
        return res.status(400).json({
          success: false,
          message: duplicateMessage,
        });
      }

      const isOtpVerified = await validateOtpSession({
        target: normalizedEmail,
        purpose: "register",
        otpSessionId,
      });

      if (!isOtpVerified) {
        return res.status(400).json({
          success: false,
          message: "Verify your email OTP before continuing",
        });
      }

      user = await User.create({
        userName: userName.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        password: "",
        address: String(address).trim(),
        authProvider: "phone",
        firebaseUid: decoded.uid,
        phoneVerified: true,
        emailVerified: true,
      });
    } else {
      user.phoneVerified = true;
      if (!user.firebaseUid) {
        user.firebaseUid = decoded.uid;
      }
      await user.save();
    }

    return sendAuthResponse(res, user, rememberMe, "Phone sign-in successful");
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message || "Phone authentication failed",
    });
  }
};

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

const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Unauthorised user!",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Unauthorised user!",
    });
  }
};

const checkAuthStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      res.clearCookie("token");
      res.clearCookie("refreshToken");
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
      });
    }

    return sendAuthResponse(res, user, true, "User authenticated");
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Unable to verify session",
    });
  }
};

const sendOtp = async (req, res) => {
  try {
    const { target, purpose = "register", channel = "email" } = req.body;
    const normalizedTarget =
      channel === "email" || String(target).includes("@")
        ? normalizeEmail(target)
        : normalizePhone(target);

    if (!normalizedTarget) {
      return res.status(400).json({ success: false, message: "Target is required" });
    }

    if (String(normalizedTarget).includes("@")) {
      if (!validateEmailFormat(normalizedTarget)) {
        return res.status(400).json({ success: false, message: "Invalid email address" });
      }

      if (isDisposableEmail(normalizedTarget)) {
        return res.status(400).json({
          success: false,
          message: "Disposable email addresses are not allowed",
        });
      }
    }

    const otp = createOtp();
    const otpHash = await bcrypt.hash(otp, 10);
    const record = await OtpVerification.create({
      target: normalizedTarget,
      purpose,
      otpHash,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    if (channel === "email" || normalizedTarget.includes("@")) {
      await sendMail({
        to: normalizedTarget,
        subject: "Your Panjab Sports verification OTP",
        text: `Your OTP is ${otp}. It expires in 10 minutes.`,
        html: `<p>Your OTP is <strong>${otp}</strong>. It expires in 10 minutes.</p>`,
      });
    } else if (channel === "whatsapp") {
      await sendWhatsappOtp({
        to: normalizedTarget,
        otp,
      });
    } else {
      await sendSmsOtp({
        to: normalizedTarget,
        otp,
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      otpSessionId: record._id,
      devOtp: process.env.NODE_ENV === "production" ? undefined : otp,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error sending OTP",
    });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { target, otp, purpose = "register", otpSessionId } = req.body;
    const normalizedTarget = String(target).includes("@")
      ? normalizeEmail(target)
      : normalizePhone(target);

    const record = await OtpVerification.findOne({
      _id: otpSessionId,
      target: normalizedTarget,
      purpose,
      expiresAt: { $gt: new Date() },
    });

    if (!record) {
      return res.status(400).json({ success: false, message: "OTP expired or not found" });
    }

    const isMatch = await bcrypt.compare(String(otp), record.otpHash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    record.verified = true;
    await record.save();

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      otpSessionId: record._id,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Error verifying OTP" });
  }
};

const changeEmail = async (req, res) => {
  try {
    const { newEmail, otpSessionId } = req.body;
    const normalizedEmail = normalizeEmail(newEmail);

    if (!normalizedEmail) {
      return res.status(400).json({ success: false, message: "New email is required" });
    }

    if (!validateEmailFormat(normalizedEmail) || isDisposableEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, message: "Use a valid non-disposable email" });
    }

    const duplicateMessage = await ensureNoDuplicateUser({
      email: normalizedEmail,
      ignoreUserId: req.user.id,
    });

    if (duplicateMessage && duplicateMessage.includes("email")) {
      return res.status(400).json({ success: false, message: duplicateMessage });
    }

    const isOtpVerified = await validateOtpSession({
      target: normalizedEmail,
      purpose: "change-email",
      otpSessionId,
    });

    if (!isOtpVerified) {
      return res.status(400).json({ success: false, message: "Verify OTP before changing email" });
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { email: normalizedEmail, emailVerified: true },
      { new: true }
    );

    await sendMail({
      to: normalizedEmail,
      subject: "Email changed",
      text: "Your account email was changed successfully.",
    });

    return sendAuthResponse(res, user, "Email changed successfully");
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Error changing email" });
  }
};

const changePhone = async (req, res) => {
  try {
    const { newPhone, firebaseIdToken, otpSessionId } = req.body;
    const normalizedPhone = normalizePhone(newPhone);

    if (!normalizedPhone) {
      return res.status(400).json({ success: false, message: "New phone is required" });
    }

    const duplicateMessage = await ensureNoDuplicateUser({
      phone: normalizedPhone,
      ignoreUserId: req.user.id,
    });

    if (duplicateMessage && duplicateMessage.includes("phone")) {
      return res.status(400).json({ success: false, message: duplicateMessage });
    }

    if (otpSessionId) {
      const isOtpVerified = await validateOtpSession({
        target: normalizedPhone,
        purpose: "change-phone",
        otpSessionId,
      });

      if (!isOtpVerified) {
        return res.status(400).json({ success: false, message: "Verify phone OTP before changing phone" });
      }
    } else {
      const verifiedPhone = await requireVerifiedPhoneToken(firebaseIdToken, normalizedPhone);
      if (verifiedPhone?.uid) {
        await User.findByIdAndUpdate(req.user.id, { firebaseUid: verifiedPhone.uid });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        phone: normalizedPhone,
        phoneVerified: true,
      },
      { new: true }
    );

    return sendAuthResponse(res, user, true, "Phone changed successfully");
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message || "Error changing phone" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, otpSessionId } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: "This account does not use password login",
      });
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    if (otpSessionId) {
      const isOtpVerified = await validateOtpSession({
        target: user.email,
        purpose: "change-password",
        otpSessionId,
      });

      if (!isOtpVerified) {
        return res.status(400).json({ success: false, message: "Password OTP verification failed" });
      }
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.mustChangePassword = false;
    user.temporaryPasswordIssuedAt = null;
    await user.save();

    await sendMail({
      to: user.email,
      subject: "Password changed",
      text: "Your password was changed successfully.",
    });

    return res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Error changing password" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { userName, address, profileImage, gender, dateOfBirth, supportContact } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (userName) {
      user.userName = userName.trim();
    }

    if (typeof address === "string") {
      user.address = address.trim();
    }

    if (typeof profileImage === "string") {
      user.profileImage = profileImage.trim();
    }

    if (typeof gender === "string") {
      user.profileMeta = {
        ...(user.profileMeta || {}),
        gender: gender.trim(),
      };
    }

    if (typeof supportContact === "string") {
      user.profileMeta = {
        ...(user.profileMeta || {}),
        supportContact: supportContact.trim(),
      };
    }

    if (dateOfBirth) {
      user.profileMeta = {
        ...(user.profileMeta || {}),
        dateOfBirth: new Date(dateOfBirth),
      };
    }

    await user.save();
    return sendAuthResponse(res, user, true, "Profile updated successfully");
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Error updating profile" });
  }
};

const getProfileSummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const [addressesCount, ordersCount, wishlistDoc, reviewsCount, couponsCount, seller] =
      await Promise.all([
        Address.countDocuments({ userId: String(userId) }),
        Order.countDocuments({ userId }),
        Wishlist.findOne({ userId }).lean(),
        ProductReview.countDocuments({ userId }),
        Coupon.countDocuments({
          expiry: { $gte: new Date() },
          $or: [{ usedBy: { $exists: false } }, { usedBy: { $nin: [userId] } }],
        }),
        Seller.findOne({ userId }).lean(),
      ]);

    const sellerOrderStats = seller
      ? await Order.aggregate([
          { $unwind: "$sellerOrders" },
          { $match: { "sellerOrders.sellerId": user._id } },
          {
            $group: {
              _id: null,
              totalSales: { $sum: "$sellerOrders.subtotal" },
              totalEarnings: { $sum: "$sellerOrders.sellerEarningTotal" },
              totalCommission: { $sum: "$sellerOrders.commissionTotal" },
              deliveredOrders: {
                $sum: {
                  $cond: [{ $eq: ["$sellerOrders.orderStatus", "delivered"] }, 1, 0],
                },
              },
              returnedOrders: {
                $sum: {
                  $cond: [{ $eq: ["$sellerOrders.orderStatus", "returned"] }, 1, 0],
                },
              },
            },
          },
        ])
      : [];

    const sellerStats = sellerOrderStats[0] || {
      totalSales: 0,
      totalEarnings: 0,
      totalCommission: 0,
      deliveredOrders: 0,
      returnedOrders: 0,
    };
    const returnRate = sellerStats.deliveredOrders
      ? Number(((sellerStats.returnedOrders / sellerStats.deliveredOrders) * 100).toFixed(2))
      : 0;

    return res.status(200).json({
      success: true,
      user: buildUserPayload(user),
      profile: {
        customer: {
          addressesCount,
          ordersCount,
          wishlistCount: wishlistDoc?.products?.length || 0,
          recentlyViewedCount: user.recentlyViewedProducts?.length || 0,
          couponsCount,
          walletBalance: Number(user.walletBalance || 0),
          reviewsCount,
        },
        seller: seller
          ? {
              businessName: seller.businessName || "",
              logo: seller.logo || "",
              bannerImage: seller.bannerImage || "",
              gst: seller.gstNumber || "",
              pan: seller.panNumber || "",
              verificationStatus: seller.status || "pending",
              supportContact: seller.supportEmail || user?.profileMeta?.supportContact || "",
              totalSales: Number(sellerStats.totalSales || 0),
              earnings: Number(sellerStats.totalEarnings || 0),
              commissionSummary: Number(sellerStats.totalCommission || 0),
              returnRate,
            }
          : null,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: "Error fetching profile summary" });
  }
};

const testEmail = async (req, res) => {
  try {
    const to = req.body?.to || req.user?.email;

    if (!to) {
      return res.status(400).json({
        success: false,
        message: "Recipient email is required",
      });
    }

    const result = await sendMail({
      to,
      subject: "SMTP test from Panjab Sports Club",
      text: "This is a test email from your MERN auth system.",
      html: "<p>This is a test email from your MERN auth system.</p>",
    });

    if (result?.skipped) {
      return res.status(200).json({
        success: false,
        message: "Email was skipped. Check SMTP configuration.",
        result,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Test email sent to ${to}`,
      result,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to send test email",
    });
  }
};

const requireAdmin = (req, res, next) => {
  if (!["admin", "super_admin"].includes(req.user?.role)) {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }

  next();
};

const requireSeller = async (req, res, next) => {
  if (req.user?.role !== "seller") {
    return res.status(403).json({
      success: false,
      message: "Seller access required",
    });
  }

  let approvedSeller = null;
  try {
    approvedSeller = await Seller.findOne({
      userId: req.user.id,
      status: "approved",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to verify seller access",
    });
  }

  if (!approvedSeller) {
    return res.status(403).json({
      success: false,
      message: "Approved seller access required",
    });
  }

  next();
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({
      success: false,
      message: "You do not have permission to access this resource",
    });
  }

  next();
};

module.exports = {
  registerUser,
  loginUser,
  loginWithGoogle,
  loginWithPhone,
  logoutUser,
  authMiddleware,
  checkAuthStatus,
  requireAdmin,
  requireSeller,
  requireRole,
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
};
