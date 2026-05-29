const { AppError } = require("../utils/errors");
const { getMessage } = require("../utils/responseMessages");

/**
 * Global Error Handler Middleware
 * Catches all errors and sends consistent JSON responses
 *
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
  // Default error values
  let statusCode = err.statusCode || 500;
  let errorCode = err.errorCode || "INTERNAL_ERROR";
  let message = err.message || "Internal server error";
  let details = err.details || null;

  // Log error for debugging
  if (statusCode >= 500) {
    console.error("❌ [Error Handler] Internal Server Error:", {
      name: err.name,
      message: err.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userId: req.user?.id,
    });
  } else {
    console.warn("⚠️ [Error Handler] Client Error:", {
      name: err.name,
      message: err.message,
      statusCode,
      url: req.originalUrl,
      method: req.method,
      userId: req.user?.id,
    });
  }

  // Handle specific error types
  if (err.name === "ValidationError") {
    // Mongoose/Sequelize validation errors
    statusCode = 400;
    errorCode = "VALIDATION_ERROR";

    if (err.errors) {
      // Extract validation error details
      details = Object.keys(err.errors).map((key) => ({
        field: key,
        message: err.errors[key].message,
      }));
    }
  } else if (err.name === "SequelizeValidationError") {
    // Sequelize validation error
    statusCode = 400;
    errorCode = "VALIDATION_ERROR";
    details = err.errors.map((e) => ({
      field: e.path,
      message: e.message,
    }));
  } else if (err.name === "SequelizeUniqueConstraintError") {
    // Unique constraint violation
    statusCode = 409;
    errorCode = "DUPLICATE_ENTRY";
    message = "Resource already exists";
    details = err.errors.map((e) => ({
      field: e.path,
      value: e.value,
    }));
  } else if (err.name === "SequelizeForeignKeyConstraintError") {
    // Foreign key constraint violation
    statusCode = 400;
    errorCode = "INVALID_REFERENCE";
    message = "Invalid reference to related resource";
  } else if (err.name === "JsonWebTokenError") {
    // JWT errors
    statusCode = 401;
    errorCode = "AUTH_TOKEN_INVALID";
    message = getMessage("AUTH_TOKEN_INVALID", "ar");
  } else if (err.name === "TokenExpiredError") {
    // JWT expired
    statusCode = 401;
    errorCode = "AUTH_TOKEN_EXPIRED";
    message = getMessage("AUTH_TOKEN_EXPIRED", "ar");
  } else if (err.name === "MulterError") {
    // File upload errors
    statusCode = 400;
    errorCode = "FILE_UPLOAD_ERROR";
    message = `File upload error: ${err.message}`;
  } else if (err.code === "ECONNREFUSED") {
    // Database connection error
    statusCode = 503;
    errorCode = "DB_CONNECTION_ERROR";
    message = getMessage("DB_CONNECTION_ERROR", "ar");
  }

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV !== "production";

  // Build error response
  const errorResponse = {
    success: false,
    error: {
      code: errorCode,
      message: message,
    },
  };

  // Add details if available
  if (details) {
    errorResponse.error.details = details;
  }

  // Add stack trace in development
  if (isDevelopment && err.stack) {
    errorResponse.error.stack = err.stack;
  }

  // Add request info in development
  if (isDevelopment) {
    errorResponse.error.path = req.originalUrl;
    errorResponse.error.method = req.method;
  }

  // Send response
  res.status(statusCode).json(errorResponse);
};

/**
 * Not Found Handler
 * Handles 404 errors for undefined routes
 */
const notFound = (req, res, next) => {
  const error = new AppError(
    `Route not found: ${req.originalUrl}`,
    404,
    "NOT_FOUND",
  );
  next(error);
};

/**
 * Async Handler Wrapper
 * Wraps async route handlers to catch errors
 *
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler,
};
