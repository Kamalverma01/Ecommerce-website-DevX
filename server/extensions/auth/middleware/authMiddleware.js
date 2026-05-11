const { verifyAccessToken } = require("../services/jwt-service");

function readBearerToken(req) {
  const authorization = req.headers.authorization || "";
  if (!authorization.startsWith("Bearer ")) return "";
  return authorization.slice("Bearer ".length).trim();
}

function authMiddleware(req, res, next) {
  try {
    const token = req.cookies?.token || readBearerToken(req);
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    req.user = verifyAccessToken(token);
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
}

module.exports = { authMiddleware };
