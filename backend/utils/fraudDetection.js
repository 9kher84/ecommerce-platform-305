// backend/utils/fraudDetection.js
// K.1) Fraud Detection Utility
// Provides device fingerprinting and fraud checks for business logic

/**
 * Extracts or generates a device fingerprint from the request.
 * In production, this would use headers (User-Agent, Accept-Language, etc.) or a specialized library/cookie.
 * For this implementation/testing, we accept a mock fingerprint from headers or body, or fallback to a constant.
 * @param {object} req - Express request object
 * @returns {string} - The device fingerprint
 */
exports.getDeviceFingerprint = (req) => {
  // 1. Try to get explicit mock fingerprint from headers (for testing)
  if (req.headers["x-device-fingerprint"]) {
    return req.headers["x-device-fingerprint"];
  }

  // 2. Try body (if relevant for the specific endpoint flow)
  if (req.body && req.body.deviceFingerprint) {
    return req.body.deviceFingerprint;
  }

  // 3. Fallback: Simple fingerprint based on IP + User Agent (Basic Production Logic)
  const ip =
    req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown-ip";
  const userAgent = req.headers["user-agent"] || "unknown-ua";

  // In a real app, hash this string
  return `${ip}|${userAgent}`;
};

/**
 * Checks for self-trading (washing) fraud.
 * Prevents a user from buying from themselves or using the same device to act as both buyer and seller.
 * @param {string} buyerFingerprint - Fingerprint of the user making the request
 * @param {string} sellerFingerprint - Fingerprint associated with the target item/seller
 * @returns {boolean} - True if fraud detected (match), False otherwise
 */
exports.detectSelfTrading = (buyerFingerprint, sellerFingerprint) => {
  if (!buyerFingerprint || !sellerFingerprint) return false;
  return buyerFingerprint === sellerFingerprint;
};

/**
 * Logs a detected fraud attempt to the centralized audit log (Console for now)
 * @param {string} type - Type of fraud (e.g., 'SELF_TRADING')
 * @param {object} details - Key-value pairs of details
 */
exports.logFraudAttempt = (type, details) => {
  const timestamp = new Date().toISOString();
  console.warn(`🚨 [SECURITY ALERT] FRAUD DETECTED`);
  console.warn(`   Type: ${type}`);
  console.warn(`   Time: ${timestamp}`);
  console.warn(`   Details:`, JSON.stringify(details, null, 2));

  // In production: Save to DB or send to alerting system (PagerDuty, Slack, etc.)
};
