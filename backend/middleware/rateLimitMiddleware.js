const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const { getRedisClient } = require('../config/redis');

const createStore = () => {
    const client = getRedisClient();

    if (process.env.NODE_ENV === 'production') {
        return new RedisStore({
            sendCommand: (...args) => client.call(...args),
        });
    }
    return undefined; // Default to MemoryStore in dev
};

const commonOptions = {
    store: createStore(),
    windowMs: 15 * 60 * 1000,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test'
};

// 🛡️ API Limiter: General protection for all /api routes
const apiLimiter = rateLimit({
    ...commonOptions,
    max: 100
});

// 🛡️ Auth Limiter: More strict for sensitive auth routes
const authLimiter = rateLimit({
    ...commonOptions,
    max: 30
});

// 🛡️ Login Limiter: Most strict for login attempts
const loginLimiter = rateLimit({
    ...commonOptions,
    max: 10
});

module.exports = {
    apiLimiter,
    authLimiter,
    loginLimiter
};
