const {
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    FraudDetectionError,
    RateLimitError,
    PaymentError,
    DatabaseError,
    ExternalServiceError,
    AppError
} = require('../../utils/errors');

describe('Custom Error Classes', () => {
    describe('AppError', () => {
        it('should create error with default values', () => {
            const error = new AppError('Test error');

            expect(error.message).toBe('Test error');
            expect(error.statusCode).toBe(500);
            expect(error.errorCode).toBe('INTERNAL_ERROR');
            expect(error.isOperational).toBe(true);
        });

        it('should create error with custom values', () => {
            const error = new AppError('Custom error', 400, 'CUSTOM_CODE');

            expect(error.message).toBe('Custom error');
            expect(error.statusCode).toBe(400);
            expect(error.errorCode).toBe('CUSTOM_CODE');
        });

        it('should have stack trace', () => {
            const error = new AppError('Test error');

            expect(error.stack).toBeDefined();
        });
    });

    describe('ValidationError', () => {
        it('should create validation error with correct status code', () => {
            const error = new ValidationError('Invalid input');

            expect(error.message).toBe('Invalid input');
            expect(error.statusCode).toBe(400);
            expect(error.name).toBe('ValidationError');
        });

        it('should support custom error code', () => {
            const error = new ValidationError('Invalid email', 'INVALID_EMAIL');

            expect(error.errorCode).toBe('INVALID_EMAIL');
        });

        it('should support details object', () => {
            const details = { field: 'email', value: 'invalid' };
            const error = new ValidationError('Invalid input', 'VALIDATION_ERROR', details);

            expect(error.details).toEqual(details);
        });
    });

    describe('AuthenticationError', () => {
        it('should create auth error with 401 status', () => {
            const error = new AuthenticationError();

            expect(error.statusCode).toBe(401);
            expect(error.name).toBe('AuthenticationError');
            expect(error.message).toBe('Authentication required');
        });

        it('should support custom message', () => {
            const error = new AuthenticationError('Invalid token');

            expect(error.message).toBe('Invalid token');
        });
    });

    describe('AuthorizationError', () => {
        it('should create authorization error with 403 status', () => {
            const error = new AuthorizationError();

            expect(error.statusCode).toBe(403);
            expect(error.name).toBe('AuthorizationError');
            expect(error.message).toBe('Access forbidden');
        });
    });

    describe('NotFoundError', () => {
        it('should create not found error with 404 status', () => {
            const error = new NotFoundError('User');

            expect(error.statusCode).toBe(404);
            expect(error.name).toBe('NotFoundError');
            expect(error.message).toBe('User not found');
            expect(error.resource).toBe('User');
        });

        it('should use default resource name', () => {
            const error = new NotFoundError();

            expect(error.message).toBe('Resource not found');
        });
    });

    describe('FraudDetectionError', () => {
        it('should create fraud error with 403 status', () => {
            const error = new FraudDetectionError();

            expect(error.statusCode).toBe(403);
            expect(error.name).toBe('FraudDetectionError');
            expect(error.message).toBe('Fraudulent activity detected');
        });

        it('should support details', () => {
            const details = { type: 'self-trading', userId: '123' };
            const error = new FraudDetectionError('Self-trading', 'SELF_TRADING', details);

            expect(error.details).toEqual(details);
        });
    });

    describe('RateLimitError', () => {
        it('should create rate limit error with 429 status', () => {
            const error = new RateLimitError();

            expect(error.statusCode).toBe(429);
            expect(error.name).toBe('RateLimitError');
        });

        it('should support retryAfter', () => {
            const error = new RateLimitError('Too many requests', 'RATE_LIMIT', 60);

            expect(error.retryAfter).toBe(60);
        });
    });

    describe('PaymentError', () => {
        it('should create payment error with 402 status', () => {
            const error = new PaymentError();

            expect(error.statusCode).toBe(402);
            expect(error.name).toBe('PaymentError');
        });
    });

    describe('DatabaseError', () => {
        it('should create database error with 500 status', () => {
            const error = new DatabaseError();

            expect(error.statusCode).toBe(500);
            expect(error.name).toBe('DatabaseError');
        });
    });

    describe('ExternalServiceError', () => {
        it('should create service error with 503 status', () => {
            const error = new ExternalServiceError('Redis');

            expect(error.statusCode).toBe(503);
            expect(error.name).toBe('ExternalServiceError');
            expect(error.message).toBe('Redis is currently unavailable');
            expect(error.service).toBe('Redis');
        });
    });

    describe('Error Inheritance', () => {
        it('should inherit from Error', () => {
            const error = new AppError('Test');

            expect(error instanceof Error).toBe(true);
        });

        it('should inherit from AppError', () => {
            const validationError = new ValidationError('Test');
            const authError = new AuthenticationError('Test');

            expect(validationError instanceof AppError).toBe(true);
            expect(authError instanceof AppError).toBe(true);
        });
    });
});
