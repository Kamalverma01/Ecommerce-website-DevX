const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppUser = require("../../../models/User");
const { failure } = require("../core/apiResponse");

async function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ")
    ? header.slice(7)
    : req.cookies?.accessToken || req.cookies?.token;

  if (!token) {
    return failure(res, "Authentication required.", 401);
  }

  try {
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET || "CLIENT_SECRET_KEY");
    } catch {
      payload = jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET || process.env.CLIENT_SECRET_KEY || "access-secret"
      );
    }

    const id = payload.id || payload._id || payload.userId;
    const user = (await AppUser.findById(id)) || (await User.findById(id));

    if (!user || user.isBlocked) {
      return failure(res, "Account is not allowed to access this resource.", 403);
    }

    req.user = user;
    next();
  } catch (error) {
    return failure(res, "Invalid or expired access token.", 401);
  }
}

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return failure(res, "You do not have permission to perform this action.", 403);
    }

    next();
  };
}

module.exports = { authenticate, requireRoles };
