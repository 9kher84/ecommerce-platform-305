const rateLimit = require("express-rate-limit");
const RedisStore = require("rate-limit-redis");
const { getRedisClient } = require("../config/redis");

const createStore = () => {
  const client = getRedisClient();

  if (process.env.NODE_ENV === "production" && process.env.REDIS_URL) {
    try {
      const Store = RedisStore.default || RedisStore;
      return new Store({
        sendCommand: (...args) => client.call(...args),
      });
    } catch (err) {
      console.warn("⚠️ Failed to initialize RedisStore, falling back to MemoryStore.");
      return undefined;
    }
  }
  return undefined; // Default to MemoryStore in dev or on Render
};

const commonOptions = {
  store: createStore(),
  windowMs: 15 * 60 * 1000,
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return (
      process.env.DISABLE_RATE_LIMIT === "true" ||
      process.env.NODE_ENV === "test"
    );
  },
};

// 🛡️ API Limiter: General protection for all /api routes
const apiLimiter = rateLimit({
  ...commonOptions,
  max: 100,
});

// 🛡️ Auth Limiter: More strict for sensitive auth routes
const authLimiter = rateLimit({
  ...commonOptions,
  max: 30,
});

// 🛡️ Login Limiter: Most strict for login attempts
const loginLimiter = rateLimit({
  ...commonOptions,
  max: 5,
  handler: (req, res, next, options) => {
    logViolation(req, "LOGIN_ATTEMPT");
    res.status(options.statusCode).send(options.message);
  },
});

// 🛡️ Log Rate Limit Violation (Internal Helper)
const logViolation = async (req, type) => {
  try {
    const { ActionLog } = require("../sequelize_setup");
    await ActionLog.create({
      adminId: req.user ? req.user.id : "UNAUTHENTICATED",
      targetId: req.ip,
      fieldName: "RATE_LIMIT_EXCEEDED",
      oldValue: type,
      newValue: "POTENTIAL_BRUTE_FORCE_ATTACK",
      ipAddress: req.ip || "0.0.0.0",
      timestamp: new Date(),
    });
    console.warn(
      `🚨 ${type} ATTEMPT BLOCKED: Rate limit exceeded for IP ${req.ip}`,
    );
  } catch (err) {
    console.error("❌ Failed to log rate limit violation:", err);
  }
};

// 🛡️ Sovereign Limiter: Most strict for critical operations
const sovereignLimiter = rateLimit({
  ...commonOptions,
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error:
      "🚨 SECURITY ALERT: Too many attempts. High-frequency operations are temporarily blocked for this IP.",
  },
  handler: (req, res, next, options) => {
    logViolation(req, req.path);
    res.status(options.statusCode).send(options.message);
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  loginLimiter,
  sovereignLimiter,
};
