const crypto = require("crypto");
const cacheService = require("../services/cacheService");
const logger = require("../utils/logger");

const idempotencyMiddleware = async (req, res, next) => {
  if (process.env.NODE_ENV === "test" || process.env.DISABLE_IDEMPOTENCY === "true") {
    return next();
  }
  try {
    let idempotencyKey = req.headers["idempotency-key"];

    // If key is not provided, we can auto-generate one based on the body hash
    if (!idempotencyKey) {
      if (req.body && Object.keys(req.body).length > 0) {
        const hash = crypto.createHash("sha256");
        hash.update(JSON.stringify(req.body));
        idempotencyKey = `auto-idemp-${hash.digest("hex")}`;
      } else {
        return next(); // Nothing to be idempotent about
      }
    }

    const cacheKey = `idempotency:${req.user ? req.user.id : "anon"}:${idempotencyKey}`;
    
    // Check if key exists
    const existingResult = await cacheService.get(cacheKey);

    if (existingResult) {
      logger.warn(`[Idempotency] Duplicate request blocked. Key: ${idempotencyKey}`, {
        correlationId: req.correlationId,
        userId: req.user ? req.user.id : null,
      });
      return res.status(409).json({
        success: false,
        message: "Duplicate request detected.",
        data: JSON.parse(existingResult)
      });
    }

    // Attach to req so the response can set it
    req.idempotencyCacheKey = cacheKey;

    // Overwrite res.json to intercept and cache the response
    const originalJson = res.json;
    res.json = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Cache success responses for 24 hours
        cacheService.set(req.idempotencyCacheKey, JSON.stringify(body), 86400).catch(err => {
          logger.error("[Idempotency] Failed to save to cache", { error: err.message, correlationId: req.correlationId });
        });
      }
      return originalJson.call(this, body);
    };

    next();
  } catch (error) {
    logger.error("[Idempotency] Middleware Error", { error: error.message, correlationId: req.correlationId });
    next();
  }
};

module.exports = idempotencyMiddleware;
