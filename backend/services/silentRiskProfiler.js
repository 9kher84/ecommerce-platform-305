const fs = require("fs");
const path = require("path");

// Ensure stats directory exists
const STATS_DIR = path.join(__dirname, "../stats");
if (!fs.existsSync(STATS_DIR)) {
  try {
    fs.mkdirSync(STATS_DIR, { recursive: true });
  } catch (e) {
    // Silent fail
  }
}
const LOG_FILE = path.join(STATS_DIR, "silent_risk.log");

/**
 * Sovereign Silent Profiler
 * NO console.log usage.
 * Writes to dedicated secured log file for future analysis.
 *
 * @param {string} action - The action type (e.g., PRODUCT_ADD, PRODUCT_UPDATE)
 * @param {object} details - The payload details (pricing delta, stock changes)
 */
exports.logSilentProfile = (action, details) => {
  try {
    const entry =
      JSON.stringify({
        timestamp: new Date().toISOString(),
        action,
        details,
      }) + "\n";

    fs.appendFile(LOG_FILE, entry, (err) => {
      if (err) {
        // Do not throw, do not log to console.
        // System should continue.
      }
    });
  } catch (error) {
    // Catastrophe avoidance: Do nothing.
  }
};
