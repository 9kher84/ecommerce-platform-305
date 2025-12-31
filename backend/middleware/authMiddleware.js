// C:\Users\s9khr\sasasa\ecommerce-platform\backend\middleware\authMiddleware.js
// This file should only contain Middleware functions

const jwt = require('jsonwebtoken');
const { User } = require('../sequelize_setup'); // خطأ: تم استيراده مرتين
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const tokenBlacklist = require('../services/tokenBlacklist');
const config = require('../config');

// 1. Protect Middleware - Verify Token
exports.protect = catchAsync(async (req, res, next) => {
    let token;
    // 1. Check Cookie (Primary)
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }
    // 2. Check Header (Fallback for Localhost/Dev/Mobile)
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Debug for Sovereign Command
    if (!token) {
        console.log('❌ Auth Failed. Cookies:', req.cookies);
        console.log('❌ Headers:', req.headers.authorization);
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    // Wrap jwt.verify in try-catch to handle invalid/expired tokens
    let decoded;
    try {
        decoded = jwt.verify(token, config.jwt.secret);
    } catch (error) {
        console.error('❌ [Auth Middleware] ID:', error.name);
        console.error('❌ [Auth Middleware] Error verifying token:', token);
        // Handle JWT verification errors (invalid signature, expired token, etc.)
        if (error.name === 'JsonWebTokenError') {
            return next(new AppError('Invalid token. Please log in again.', 401));
        }
        if (error.name === 'TokenExpiredError') {
            return next(new AppError('Your token has expired. Please log in again.', 401));
        }
        return next(new AppError('Authentication failed. Please log in again.', 401));
    }

    // ✅ JTI Blacklist Check (Day 3 Feature)
    if (decoded.jti) {
        const isRevoked = await tokenBlacklist.isBlacklisted(decoded.jti);
        if (isRevoked) {
            // Remove the cookie immediately if identified as revoked
            res.cookie('token', 'none', {
                expires: new Date(Date.now() + 10 * 1000),
                httpOnly: true
            });
            return next(new AppError('Session revoked. Please log in again.', 401));
        }
    }

    const currentUser = await User.findByPk(decoded.id);

    if (!currentUser) {
        return next(new AppError('The user belonging to this token no longer exists.', 401));
    }

    req.user = currentUser;
    // Attach JTI to req.user for use in Logout
    req.user.jti = decoded.jti;
    // Attach expiration for calculating TTL
    req.user.exp = decoded.exp;

    next();
});

// 2. RestrictTo Middleware - Role Based Access Control
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // console.log(`[Auth] Checking role: ${req.user.role} against allowed: ${roles}`);
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError('You do not have permission to perform this action', 403)
            );
        }
        next();
    };
};

// Alias authorize to restrictTo for backward compatibility / clarity
exports.authorize = exports.restrictTo;

// E.1) isSeller Middleware - Restrict to Seller Role Only
exports.isSeller = (req, res, next) => {
    if (!req.user) {
        return next(new AppError('Authentication required. Please log in.', 401));
    }

    if (req.user.role !== 'seller') {
        return next(new AppError('Forbidden: Only sellers can access this resource.', 403));
    }

    next();
};
