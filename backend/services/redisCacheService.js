const Redis = require('ioredis');

// Singleton Redis Client
let redisClient = null;

function getClient() {
    if (!redisClient) {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        redisClient = new Redis(redisUrl, {
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
            maxRetriesPerRequest: 3
        });

        redisClient.on('error', (err) => {
            console.error('Redis Client Error', err);
        });
    }
    return redisClient;
}

/**
 * Secure Bulk Preview Cache using Redis.
 * Enforces TTL and Atomic Operations.
 * 
 * @param {string} token 
 * @param {object} data 
 * @param {number} ttlSeconds 
 */
exports.setBulkPreview = async (token, data, ttlSeconds = 900) => {
    const client = getClient();
    const key = `bulk_preview:${token}`;
    await client.setex(key, ttlSeconds, JSON.stringify(data));
};

/**
 * Retrieve and Delete (Atomic Pop)
 * @param {string} token 
 * @returns {Promise<object|null>}
 */
exports.popBulkPreview = async (token) => {
    const client = getClient();
    const key = `bulk_preview:${token}`;

    // Lua script to Get and Delete atomically
    // This ensures One-Time-Use strictly
    const result = await client.multi()
        .get(key)
        .del(key)
        .exec();

    // result[0] is [error, resultOfGet]
    // result[1] is [error, resultOfDel]

    if (result[0][0]) throw result[0][0]; // Redis error

    const dataStr = result[0][1];
    if (!dataStr) return null;

    return JSON.parse(dataStr);
};
