const rateLimit = require("express-rate-limit");

/**
 * Delegation Rate Limiter
 * Limits usage of 'x-acting-as' header to prevent DoS/Abuse.
 */
const delegationLimiter = rateLimit({
  windowMs: (process.env.DELEGATION_RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes default
  max: process.env.DELEGATION_RATE_LIMIT_MAX || 100, // Limit each IP to 100 delegation requests per window
  skip: (req) => !req.headers["x-acting-as"], // Only limit requests WITH the header
  message: {
    error: "Too many delegation attempts from this IP, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = delegationLimiter;
