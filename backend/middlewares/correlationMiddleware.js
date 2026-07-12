const { v4: uuidv4 } = require("uuid");
const logger = require("../utils/logger");

const correlationMiddleware = (req, res, next) => {
  const correlationId = req.headers["x-correlation-id"] || uuidv4();
  req.correlationId = correlationId;
  res.setHeader("x-correlation-id", correlationId);

  // Add it to Winston child logger or local store if needed, 
  // but we can just pass it through the req object.
  logger.info(`[Correlation] Request started: ${req.method} ${req.originalUrl}`, {
    correlationId,
    method: req.method,
    url: req.originalUrl,
  });

  next();
};

module.exports = correlationMiddleware;
