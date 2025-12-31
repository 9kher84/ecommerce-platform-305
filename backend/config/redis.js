const Redis = require('ioredis');
const config = require('./index');

// F.2) Create Redis Client with Fallback
let redisClient;
let isAvailable = false;

// Mock client for fallback
const mockClient = {
    call: async () => null,
    on: () => { },
    connect: async () => { },
    disconnect: async () => { },
    quit: async () => { },
    get: async () => null,
    set: async () => 'OK',
    setex: async () => 'OK',
    del: async () => 0,
    exists: async () => 0,
    expire: async () => 0,
    ttl: async () => -1,
    isReady: true,
    status: 'ready'
};

try {
    if (process.env.DISABLE_REDIS === 'true' || process.env.NODE_ENV === 'test') {
        console.log('🚫 Redis disabled via config or Test Env. Using mock client.');
        throw new Error('Redis disabled/Test Mode');
    }

    // Attempt to create Redis connection
    redisClient = new Redis({
        host: config.redis.host,
        port: config.redis.port,
        password: config.redis.password,
        retryStrategy: (times) => {
            // Stop retrying after 3 attempts
            if (times > 3) {
                console.log('⚠️ Redis connection failed after 3 attempts. Using mock client.');
                return null;
            }
            // Retry after delay
            return Math.min(times * 100, 2000);
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true // Don't connect immediately
    });

    // Event handlers
    redisClient.on('connect', () => {
        console.log('✅ Redis connected successfully');
        isAvailable = true;
    });

    redisClient.on('ready', () => {
        console.log('✅ Redis is ready');
        isAvailable = true;
    });

    redisClient.on('error', (err) => {
        console.error('❌ Redis connection error:', err.message);
        isAvailable = false;
        // SOVEREIGN POLICY: Zero Trust - No Memory Fallback in Production
        if (config.env === 'production') {
            console.error('⛔ FATAL: Redis is required for production security (Rate Limiting, Session Management). Exiting.');
            process.exit(1);
        }
    });

    redisClient.on('close', () => {
        console.log('⚠️ Redis connection closed');
        isAvailable = false;
    });

    // Try to connect
    redisClient.connect().catch((err) => {
        console.error('❌ Failed to connect to Redis:', err.message);
        if (config.env === 'production') {
            console.error('⛔ FATAL: Redis connection failed in Production. Exiting.');
            process.exit(1);
        }
        // Dev fallback allowed strictly for local dev convenience, 
        // but prompt asked to "Modify to stop system".
        // I will enforce strictness even in dev if that's the "Sovereign" way, 
        // but usually dev needs fallback. 
        // "Remove memory fallback option... stop system when Redis crashes".
        // Okay, I will disable fallback entirely.
        console.error('⛔ Redis connection failed. System stopping as per Zero Trust Policy.');
        process.exit(1);
    });

} catch (error) {
    if (error.message === 'Redis disabled' || error.message === 'Redis disabled/Test Mode') {
        // Expected "Error" flow for disabled state
        console.log('🚫 Using mock Redis client as fallback (Configured/Test)');
        redisClient = mockClient;
        isAvailable = false;
    } else {
        console.error('❌ Redis initialization error:', error.message);
        console.error('⛔ System stopping as per Zero Trust Policy.');
        process.exit(1);
    }
}

// Wait to verify? No, the events handles it.
// Removed setTimeout mock fallback logic.


module.exports = {
    redisConnection: redisClient,
    isRedisAvailable: () => isAvailable,
    getRedisClient: () => redisClient
};