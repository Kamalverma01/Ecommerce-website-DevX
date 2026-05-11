/**
 * Auth Middleware
 * Verifies JWT token from cookies and attaches user to request
 */

const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "CLIENT_SECRET_KEY";

/**
 * Middleware to verify JWT token from HTTP-only cookie
 * Attaches decoded user object to req.user
 * 
 * @returns {void} Calls next() if token is valid, returns 401 if invalid
 */
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: No token provided",
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    
    // Check if token is expired to provide specific error
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
        code: "TOKEN_EXPIRED",
      });
    }
    
    return res.status(401).json({
      success: false,
      message: "Invalid or malformed token",
    });
  }
};

/**
 * Optional auth middleware - doesn't fail if no token
 * Used when token is optional for some routes
 */
const optionalAuthMiddleware = (req, res, next) => {
  try {
    const token = req.cookies.token;
    
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    }
    next();
  } catch (error) {
    // If token exists but is invalid, still continue
    // Frontend will handle the invalid token
    next();
  }
};

module.exports = {
  authMiddleware,
  optionalAuthMiddleware,
};
