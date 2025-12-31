const AppError = require('../utils/appError');
const asyncHandler = require('express-async-handler');

/**
 * Strict Owner Authorization
 * Only allows the specific OWNER_ID defined in environment.
 * Ignores Roles/Permissions.
 */
const ownerAuth = asyncHandler(async (req, res, next) => {
    const ownerId = process.env.OWNER_ID;

    // Ensure user is authenticated first (protected route)
    if (!req.user || !req.user.id) {
        return next(new AppError('Not authenticated', 401));
    }

    if (req.user.id !== ownerId) {
        console.warn(`[Security Alert] Non-Owner ${req.user.id} attempted to access Owner Panel.`);
        return next(new AppError('Sovereign Access Only', 403));
    }

    next();
});

module.exports = ownerAuth;
