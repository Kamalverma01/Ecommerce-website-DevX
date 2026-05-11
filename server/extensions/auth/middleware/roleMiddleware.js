function adminOnly(req, res, next) {
  if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
  if (!["admin", "super_admin"].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "Admin only" });
  }
  return next();
}

function sellerOnly(req, res, next) {
  if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
  if (req.user.role !== "seller") {
    return res.status(403).json({ success: false, message: "Seller only" });
  }
  return next();
}

function userOnly(req, res, next) {
  if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized" });
  if (!["user", "customer"].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: "Customer only" });
  }
  return next();
}

module.exports = { adminOnly, sellerOnly, userOnly };
