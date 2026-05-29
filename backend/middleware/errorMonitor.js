const logger = require("../utils/logger");

// Sliding Window Counter for Error Rate
const ERROR_WINDOW_MS = 60000; // 1 Minute
const ALERT_THRESHOLD_PERCENT = 1; // 1%

let requestCount = 0;
let errorCount = 0;
let intervalRef = null;

const startMonitoring = () => {
  if (intervalRef) return;
  intervalRef = setInterval(() => {
    if (requestCount > 100) {
      // Minimum traffic to trigger
      const errorRate = (errorCount / requestCount) * 100;
      if (errorRate > ALERT_THRESHOLD_PERCENT) {
        logger.alert(`High Error Rate Detected: ${errorRate.toFixed(2)}%`, {
          requests: requestCount,
          errors: errorCount,
        });
      }
    }
    // Reset window
    requestCount = 0;
    errorCount = 0;
  }, ERROR_WINDOW_MS);
};

const errorMonitorMiddleware = (req, res, next) => {
  if (!intervalRef) startMonitoring();

  requestCount++;

  // Intercept response finish to check status code
  res.on("finish", () => {
    if (res.statusCode >= 500) {
      errorCount++;
    }
  });

  next();
};

module.exports = errorMonitorMiddleware;
