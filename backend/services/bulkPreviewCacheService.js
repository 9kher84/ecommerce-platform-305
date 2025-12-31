const crypto = require('crypto');

// Private In-Memory Cache (Infrastructure Isolation)
// Maps token -> { data: [], expiresAt: number }
const bulkUploadCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 Minutes

// Cleanup Interval (Every hour) to prevent memory leaks
const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [token, entry] of bulkUploadCache.entries()) {
        if (now > entry.expiresAt) {
            bulkUploadCache.delete(token);
        }
    }
}, 60 * 60 * 1000);

// Prevent process hang by unrefing the interval (node specific)
if (cleanupInterval.unref) cleanupInterval.unref();

/**
 * Generates a preview token and caches the data.
 * @param {Array} data - The bulk data payload
 * @returns {object} - { token, expiresInSeconds }
 */
exports.cacheBulkData = (data) => {
    const token = crypto.randomBytes(32).toString('hex');
    bulkUploadCache.set(token, {
        data: data,
        expiresAt: Date.now() + CACHE_TTL_MS
    });
    return { token, expiresInSeconds: CACHE_TTL_MS / 1000 };
};

/**
 * Retrieves valid cached data and invalidates the token (One-time use).
 * @param {string} token 
 * @returns {Array|null} - Null if invalid/expired
 */
exports.retrieveAndInvalidate = (token) => {
    const cached = bulkUploadCache.get(token);

    if (!cached) return null;

    // Check expiry
    if (Date.now() > cached.expiresAt) {
        bulkUploadCache.delete(token);
        return null;
    }

    // Invalidate immediately (Sovereign rule: One-time use)
    bulkUploadCache.delete(token);

    return cached.data;
};
