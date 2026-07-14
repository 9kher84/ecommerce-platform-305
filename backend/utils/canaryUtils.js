const crypto = require("crypto");

/**
 * Hash a stable string (e.g. userId) to a number between 0 and 99.
 * This guarantees that a user will consistently fall into the same bucket.
 */
function hashToPercent(idStr) {
  if (!idStr) return Math.floor(Math.random() * 100);
  
  const hash = crypto.createHash("md5").update(idStr.toString()).digest("hex");
  // Convert first 8 characters to integer and modulo 100
  return parseInt(hash.substring(0, 8), 16) % 100;
}

/**
 * Determines if a request should be routed to the New Catalog Architecture (Canary).
 * Priorities:
 * 1. Forced Header (X-Canary-Catalog: "true" | "false")
 * 2. Feature Flag (USE_NEW_CATALOG_READS === 'false' -> OFF)
 * 3. Canary Percentage (CANARY_READ_PERCENTAGE)
 */
function shouldRouteToCanary(req) {
  // 1. Forced Header
  const headerVal = req.headers ? req.headers['x-canary-catalog'] : undefined;
  if (headerVal === 'true') return true;
  if (headerVal === 'false') return false;

  // 2. Feature Flag Hard Switch
  if (process.env.USE_NEW_CATALOG_READS === 'false') return false;
  if (process.env.USE_NEW_CATALOG_READS !== 'true') return false; // Must be explicitly true

  // 3. Canary Percentage
  const percentageStr = process.env.CANARY_READ_PERCENTAGE || "0";
  const percentage = parseInt(percentageStr, 10);
  if (isNaN(percentage) || percentage <= 0) return false;
  if (percentage >= 100) return true;

  // Evaluate Hash Bucket
  const userId = req.user ? req.user.id : null;
  const bucket = hashToPercent(userId);
  
  return bucket < percentage;
}

module.exports = {
  hashToPercent,
  shouldRouteToCanary
};
