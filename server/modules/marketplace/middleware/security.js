const rateLimit = require("express-rate-limit");
const { failure } = require("../core/apiResponse");

const marketplaceRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

function apiLogger(req, res, next) {
  req.requestStartedAt = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - req.requestStartedAt;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
}

function requireBody(fields = []) {
  return (req, res, next) => {
    const missing = fields.filter((field) => req.body[field] === undefined || req.body[field] === "");
    if (missing.length) {
      return failure(res, "Validation failed.", 422, missing.map((field) => `${field} is required.`));
    }

    next();
  };
}

module.exports = { marketplaceRateLimit, apiLogger, requireBody };
