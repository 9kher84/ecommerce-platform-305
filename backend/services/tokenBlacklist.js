// backend/services/tokenBlacklist.js
// F.3) Real Redis Blacklist with Fallback
// Provides a unified interface for token blacklisting (jti revocation).

const { getRedisClient, isRedisAvailable } = require("../config/redis");

// Mock fallback storage
const mockBlacklist = new Map();

/**
 * Adds a JTI to the blacklist with a specific TTL.
 * @param {string} jti - The Unique Token Identifier.
 * @param {number} expiresInSeconds - Time in seconds until the token naturally expires.
 */
exports.addToBlacklist = async (jti, expiresInSeconds) => {
  try {
    if (isRedisAvailable()) {
      // Real Redis Implementation
      const redis = getRedisClient();
      await redis.setex(`blacklist:${jti}`, expiresInSeconds, "revoked");
      console.log(
        `🔒 [Redis Blacklist] Added JTI: ${jti} (Expires in ${expiresInSeconds}s)`,
      );
    } else {
      // Mock Implementation Fallback
      const expiryTime = Date.now() + expiresInSeconds * 1000;
      mockBlacklist.set(jti, expiryTime);

      // Auto-cleanup for mock memory management
      setTimeout(() => {
        mockBlacklist.delete(jti);
        console.log(`🧹 [Mock Blacklist] Auto-removed expired JTI: ${jti}`);
      }, expiresInSeconds * 1000).unref();

      console.log(
        `🔒 [Mock Blacklist] Added JTI: ${jti} (Expires in ${expiresInSeconds}s)`,
      );
    }
  } catch (error) {
    console.error("❌ Error adding to blacklist:", error.message);
    // Fallback to mock on error
    const expiryTime = Date.now() + expiresInSeconds * 1000;
    mockBlacklist.set(jti, expiryTime);
    console.log(`🔒 [Mock Blacklist - Fallback] Added JTI: ${jti}`);
  }
};

/**
 * Checks if a JTI is blacklisted.
 * @param {string} jti - The Unique Token Identifier.
 * @returns {boolean} - True if blacklisted, False otherwise.
 */
exports.isBlacklisted = async (jti) => {
  try {
    if (isRedisAvailable()) {
      // Real Redis Implementation
      const redis = getRedisClient();
      const result = await redis.get(`blacklist:${jti}`);
      const isBlacklisted = result === "revoked";
      console.log(
        `🔍 [Redis Blacklist] Checking JTI: ${jti} - ${isBlacklisted ? "BLACKLISTED" : "OK"}`,
      );
      return isBlacklisted;
    } else {
      // Mock Implementation Fallback
      console.log(`🔍 [Mock Blacklist] Checking JTI: ${jti}`);

      if (mockBlacklist.has(jti)) {
        const expiryTime = mockBlacklist.get(jti);
        if (Date.now() > expiryTime) {
          mockBlacklist.delete(jti);
          return false;
        }
        return true;
      }
      return false;
    }
  } catch (error) {
    console.error("❌ Error checking blacklist:", error.message);
    // Fallback to mock on error
    if (mockBlacklist.has(jti)) {
      const expiryTime = mockBlacklist.get(jti);
      if (Date.now() > expiryTime) {
        mockBlacklist.delete(jti);
        return false;
      }
      return true;
    }
    return false;
  }
};

/**
 * Debugging Helper: Get current blacklist size
 */
exports.getSize = () => {
  if (isRedisAvailable()) {
    return "Redis (size unknown)";
  }
  return mockBlacklist.size;
};
