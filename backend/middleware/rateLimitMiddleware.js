const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const { getRedisClient, isRedisAvailable } = require('../config/redis');

// Helper to determine max requests based on environment and config
const getMaxRequests = (prodLimit, devLimit) => {
    // 1. Check specific Rate Limit Override
    if (process.env.RATE_LIMIT_MAX) {
        return parseInt(process.env.RATE_LIMIT_MAX, 10);
    }
    // 2. Test Environment (High limit if not explicitly disabled)
    if (process.env.NODE_ENV === 'test') {
        return 100000;
    }
    // 3. Production vs Development
    if (process.env.NODE_ENV === 'production') {
        return prodLimit;
    }
    return devLimit;
};

// Check if Rate Limit should be enabled
const isRateLimitEnabled = () => {
    if (process.env.DISABLE_RATE_LIMIT === 'true') return false;
    if (process.env.RATE_LIMIT_ENABLED === 'false') return false;
    return true;
};

// Skip function for smart rate limiting
const skipRequest = (req) => {
    // 1. Skip if disabled via ENV
    if (!isRateLimitEnabled()) return true;

    // 2. Skip Health Checks
    if (req.path.match(/^\/api\/health/)) return true;

    // 3. Skip Performance Tools (Autocannon) in NON-PRODUCTION
    if (process.env.NODE_ENV !== 'production') {
        const ua = req.headers['user-agent'] || '';
        if (ua.includes('autocannon')) return true;
    }

    return false;
};

// Create store based on Redis availability
const createStore = () => {
    const client = getRedisClient();
    // Use Redis if available OR if we are configured to use it (trusting lazy connect)
    if (isRedisAvailable() || (process.env.REDIS_HOST && client)) {
        console.log('✅ Using Redis for rate limiting');
        return new RedisStore({
            // @ts-expect-error - Known issue with the library's type definitions
            sendCommand: (...args) => client.call(...args),
        });
    } else {
        console.log('⚠️ Using memory store for rate limiting (Redis unavailable)');
        return undefined; // express-rate-limit will use default MemoryStore
    }
};

// General API Limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: getMaxRequests(100, 1000),
    message: {
        status: 429,
        error: 'Too many requests from this IP, please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: createStore(),
    skip: skipRequest
});

// Strict Login Limiter (Enhanced Security)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: getMaxRequests(50, 100), // Reduced from 100 to 50 in production
    message: {
        status: 429,
        error: 'Too many login attempts from this IP, please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: createStore(),
    skip: skipRequest
});

// Very Strict Auth Limiter (for sensitive operations)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: getMaxRequests(30, 100), // Very strict in production
    message: {
        status: 429,
        error: 'Too many authentication requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: createStore(),
    skip: skipRequest
});

// Payment Limiter (for payment endpoints)
const paymentLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: getMaxRequests(20, 100), // Very strict for payments
    message: {
        status: 429,
        error: 'Too many payment requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: createStore(),
    skip: skipRequest
});

module.exports = {
    apiLimiter,
    loginLimiter,
    authLimiter,
    paymentLimiter
};
