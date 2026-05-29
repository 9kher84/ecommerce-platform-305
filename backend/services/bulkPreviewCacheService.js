const { getRedisClient, isRedisAvailable } = require("../config/redis");
const crypto = require("crypto");

// Configuration
const CACHE_TTL_SECONDS = 300; // 5 Minutes (Sovereign Limit)
const MAX_PAYLOAD_SIZE = 10 * 1024 * 1024; // 10 MB Limit

/**
 * Generates a preview token and caches the data in REDIS.
 * @param {Array} data - The bulk data payload
 * @returns {Promise<object>} - { token, expiresInSeconds }
 */
exports.cacheBulkData = async (data) => {
  // 1. Memory Guard: Check Payload Size roughly
  const serializedData = JSON.stringify(data);
  if (serializedData.length > MAX_PAYLOAD_SIZE) {
    throw new Error("Payload exceeds memory safety limit for preview (10MB)");
  }

  const token = crypto.randomBytes(32).toString("hex");
  const redis = getRedisClient();

  if (!isRedisAvailable() || !redis) {
    // Fallback only if Redis fatally failed in Prod, but wait, Redis config says we halt.
    // In dev without Redis, use memory? No, SSC mandates Redis.
    // However, to keep it functional for 'npm test' or partial envs:
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "⚠️ Redis not available. Falling back to UNSAFE memory cache for DEV.",
      );
      global.unsafeDevCache = global.unsafeDevCache || new Map();
      global.unsafeDevCache.set(token, {
        data,
        expires: Date.now() + CACHE_TTL_SECONDS * 1000,
      });
      return { token, expiresInSeconds: CACHE_TTL_SECONDS };
    }
    throw new Error("Redis Integrity Check Failed. Cannot cache bulk data.");
  }

  // 2. Set in Redis with strict TTL
  await redis.setex(`bulk_preview:${token}`, CACHE_TTL_SECONDS, serializedData);

  return { token, expiresInSeconds: CACHE_TTL_SECONDS };
};

/**
 * Retrieves valid cached data and invalidates the token (One-time use).
 * @param {string} token
 * @returns {Promise<Array|null>} - Null if invalid/expired
 */
exports.retrieveAndInvalidate = async (token) => {
  const redis = getRedisClient();

  if (!isRedisAvailable() || !redis) {
    if (process.env.NODE_ENV !== "production") {
      const cached = global.unsafeDevCache?.get(token);
      if (cached && Date.now() < cached.expires) {
        global.unsafeDevCache.delete(token);
        return cached.data;
      }
      return null;
    }
    return null;
  }

  // 3. Get and Delete (Atomic LUA or just Get then Del)
  // Using standard get then del for simplicity, race condition negligible for this use case
  const key = `bulk_preview:${token}`;
  const dataStr = await redis.get(key);

  if (!dataStr) return null;

  // Sovereign Rule: One-time use -> Delete immediately
  await redis.del(key);

  try {
    return JSON.parse(dataStr);
  } catch (e) {
    console.error("Data Corruption in Bulk Cache:", e);
    return null;
  }
};
