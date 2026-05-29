const logger = require("../config/logger");

// Regex patterns for sensitive data
const SENSITIVE_PATTERNS = [
  // IPv4 Addresses (excluding localhost)
  /\b(?!127\.0\.0\.1|0\.0\.0\.0)(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,

  // Table names (specific honeytokens or internal structure)
  /admin_credentials_backup/gi,
  /payment_gateway_keys/gi,
  /users_table/gi,
  /sequelize_meta/gi,

  // AWS/Cloud Keys
  /(AKIA[0-9A-Z]{16})/g,

  // High Entropy Strings (Potential API Keys or Tokens) - Simple heuristic
  /\b[A-Za-z0-9-_]{40,}\b/g,

  // Internal Paths
  /\/var\/www\/html/g,
  /Users\\s9khr/g,
];

const aiOutputSanitizer = (req, res, next) => {
  const originalSend = res.send;
  const originalJson = res.json;

  const sanitize = (data) => {
    if (typeof data === "string") {
      let sanitized = data;
      let unauthorized = false;

      SENSITIVE_PATTERNS.forEach((pattern) => {
        if (pattern.test(sanitized)) {
          unauthorized = true;
          sanitized = sanitized.replace(
            pattern,
            "[REDACTED_BY_SOVEREIGN_PROTOCOL]",
          );
        }
      });

      if (unauthorized) {
        logger.warn(
          `🛡️ AI Output Sanitizer blocked sensitive data leak in request ${req.id}`,
        );
        // Optional: Replace entire response with "Sovereign Error" if strictly required
        // return "خطأ سيادي: تم حجب المخرجات لأسباب أمنية";
      }
      return sanitized;
    }

    if (typeof data === "object" && data !== null) {
      // Deep recursive sanitization could be expensive, doing shallow 1-level for now or stringify
      const str = JSON.stringify(data);
      const sanitizedStr = sanitize(str);
      if (str !== sanitizedStr) {
        return JSON.parse(sanitizedStr);
      }
    }
    return data;
  };

  res.send = function (body) {
    // For now, applying to all application/json
    if (
      res.get("Content-Type") &&
      res.get("Content-Type").includes("application/json")
    ) {
      try {
        const parsed = typeof body === "string" ? JSON.parse(body) : body;
        const clean = sanitize(parsed);
        return originalSend.call(this, JSON.stringify(clean));
      } catch (e) {
        // Not JSON, sanitize string directly
        return originalSend.call(this, sanitize(body));
      }
    }
    return originalSend.call(this, body);
  };

  res.json = function (body) {
    return originalJson.call(this, sanitize(body));
  };

  next();
};

module.exports = aiOutputSanitizer;
