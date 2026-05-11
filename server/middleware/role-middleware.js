/**
 * Role-Based Access Control Middleware
 * Provides different role checking middlewares for authorization
 */

const Seller = require("../models/Seller");

/**
 * Requires user to have admin role
 * 
 * @param {Object} req - Express request object with req.user
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: User not authenticated",
    });
  }

  if (req.user.role !== "admin" && req.user.role !== "super_admin") {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Admin access required",
    });
  }

  next();
};

/**
 * Requires user to have seller role and approved seller status
 * 
 * @param {Object} req - Express request object with req.user
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const requireSeller = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: User not authenticated",
    });
  }

  if (req.user.role !== "seller") {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Seller access required",
    });
  }

  try {
    // Verify seller is approved
    const approvedSeller = await Seller.findOne({
      userId: req.user.id,
      status: "approved",
    });

    if (!approvedSeller) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Seller must be approved",
      });
    }

    // Attach seller info to request
    req.seller = approvedSeller;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error verifying seller status",
    });
  }
};

/**
 * Requires user to have one of specified roles
 * 
 * @param {...string} roles - List of allowed roles
 * @returns {Function} Middleware function
 * 
 * @example
 * router.get("/route", requireRole("user", "seller"), handler);
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: User not authenticated",
    });
  }

  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Forbidden: Access requires one of these roles: ${roles.join(", ")}`,
    });
  }

  next();
};

/**
 * Requires regular user role (not admin/seller)
 * 
 * @param {Object} req - Express request object with req.user
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const requireUser = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: User not authenticated",
    });
  }

  if (req.user.role !== "user") {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Regular user access required",
    });
  }

  next();
};

module.exports = {
  requireAdmin,
  requireSeller,
  requireRole,
  requireUser,
};
