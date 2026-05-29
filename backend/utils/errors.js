/**
 * Base Application Error Class
 * All custom errors should extend this class
 */
class AppError extends Error {
  constructor(message, statusCode = 500, errorCode = "INTERNAL_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true; // Operational errors vs programming errors

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error - 400 Bad Request
 * Used for input validation failures
 */
class ValidationError extends AppError {
  constructor(message, errorCode = "VALIDATION_ERROR", details = null) {
    super(message, 400, errorCode);
    this.name = "ValidationError";
    this.details = details; // Additional validation details
  }
}

/**
 * Authentication Error - 401 Unauthorized
 * Used when authentication is required or fails
 */
class AuthenticationError extends AppError {
  constructor(
    message = "Authentication required",
    errorCode = "AUTH_REQUIRED",
  ) {
    super(message, 401, errorCode);
    this.name = "AuthenticationError";
  }
}

/**
 * Authorization Error - 403 Forbidden
 * Used when user doesn't have permission
 */
class AuthorizationError extends AppError {
  constructor(message = "Access forbidden", errorCode = "FORBIDDEN") {
    super(message, 403, errorCode);
    this.name = "AuthorizationError";
  }
}

/**
 * Not Found Error - 404 Not Found
 * Used when a resource is not found
 */
class NotFoundError extends AppError {
  constructor(resource = "Resource", errorCode = "NOT_FOUND") {
    super(`${resource} not found`, 404, errorCode);
    this.name = "NotFoundError";
    this.resource = resource;
  }
}

/**
 * Fraud Detection Error - 403 Forbidden
 * Used when fraudulent activity is detected
 */
class FraudDetectionError extends AppError {
  constructor(
    message = "Fraudulent activity detected",
    errorCode = "FRAUD_DETECTED",
    details = null,
  ) {
    super(message, 403, errorCode);
    this.name = "FraudDetectionError";
    this.details = details;
  }
}

/**
 * Rate Limit Error - 429 Too Many Requests
 * Used when rate limit is exceeded
 */
class RateLimitError extends AppError {
  constructor(
    message = "Too many requests",
    errorCode = "RATE_LIMIT_EXCEEDED",
    retryAfter = null,
  ) {
    super(message, 429, errorCode);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}

/**
 * Payment Error - 402 Payment Required
 * Used for payment-related failures
 */
class PaymentError extends AppError {
  constructor(
    message = "Payment failed",
    errorCode = "PAYMENT_FAILED",
    details = null,
  ) {
    super(message, 402, errorCode);
    this.name = "PaymentError";
    this.details = details;
  }
}

/**
 * Database Error - 500 Internal Server Error
 * Used for database operation failures
 */
class DatabaseError extends AppError {
  constructor(
    message = "Database operation failed",
    errorCode = "DATABASE_ERROR",
  ) {
    super(message, 500, errorCode);
    this.name = "DatabaseError";
  }
}

/**
 * External Service Error - 503 Service Unavailable
 * Used when external service is unavailable
 */
class ExternalServiceError extends AppError {
  constructor(service = "External service", errorCode = "SERVICE_UNAVAILABLE") {
    super(`${service} is currently unavailable`, 503, errorCode);
    this.name = "ExternalServiceError";
    this.service = service;
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  FraudDetectionError,
  RateLimitError,
  PaymentError,
  DatabaseError,
  ExternalServiceError,
};
