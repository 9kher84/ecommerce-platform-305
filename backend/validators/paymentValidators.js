const Joi = require('joi');

/**
 * Payment Validation Schemas
 * Using Joi for request validation
 */

// Initiate Payment Schema
const initiatePaymentSchema = Joi.object({
    dealId: Joi.number().integer().positive().required()
        .messages({
            'number.base': 'Deal ID must be a number',
            'number.positive': 'Deal ID must be positive',
            'any.required': 'Deal ID is required'
        }),

    amount: Joi.number().positive().precision(2).required()
        .messages({
            'number.base': 'Amount must be a number',
            'number.positive': 'Amount must be positive',
            'any.required': 'Amount is required'
        }),

    currency: Joi.string().length(3).uppercase().default('SAR')
        .messages({
            'string.length': 'Currency must be 3 characters (ISO 4217)',
            'string.uppercase': 'Currency must be uppercase'
        }),

    paymentGateway: Joi.string().valid('mada', 'stc_pay', 'stcpay', 'apple_pay', 'test').required()
        .messages({
            'any.only': 'Invalid payment gateway. Supported: mada, stc_pay, apple_pay',
            'any.required': 'Payment gateway is required'
        }),

    paymentMethodId: Joi.string().uuid().optional()
        .messages({
            'string.guid': 'Payment method ID must be a valid UUID'
        }),

    metadata: Joi.object().optional()
});

// Process Payment Schema
const processPaymentSchema = Joi.object({
    gatewayResponse: Joi.object().required()
        .messages({
            'any.required': 'Gateway response is required'
        })
});

// Save Payment Method Schema
const savePaymentMethodSchema = Joi.object({
    type: Joi.string().valid('card', 'wallet', 'bank_account').required()
        .messages({
            'any.only': 'Type must be: card, wallet, or bank_account',
            'any.required': 'Payment method type is required'
        }),

    provider: Joi.string().valid('mada', 'stc_pay', 'apple_pay', 'visa', 'mastercard').required()
        .messages({
            'any.only': 'Invalid provider',
            'any.required': 'Provider is required'
        }),

    cardData: Joi.object({
        lastFour: Joi.string().length(4).pattern(/^\d+$/).required()
            .messages({
                'string.length': 'Last four digits must be exactly 4 digits',
                'string.pattern.base': 'Last four must contain only numbers'
            }),

        brand: Joi.string().required()
            .messages({
                'any.required': 'Card brand is required'
            }),

        expiryMonth: Joi.number().integer().min(1).max(12).required()
            .messages({
                'number.min': 'Expiry month must be between 1 and 12',
                'number.max': 'Expiry month must be between 1 and 12',
                'any.required': 'Expiry month is required'
            }),

        expiryYear: Joi.number().integer().min(new Date().getFullYear()).required()
            .messages({
                'number.min': 'Expiry year cannot be in the past',
                'any.required': 'Expiry year is required'
            })
    }).required()
        .messages({
            'any.required': 'Card data is required'
        }),

    isDefault: Joi.boolean().default(false)
});

// Webhook Schema
const webhookSchema = Joi.object({
    gateway: Joi.string().required(),
    transactionId: Joi.string().required(),
    status: Joi.string().valid('completed', 'failed', 'pending', 'refunded').required(),
    gatewayResponse: Joi.object().required()
});

// Refund Schema
const refundSchema = Joi.object({
    amount: Joi.number().positive().precision(2).optional()
        .messages({
            'number.positive': 'Refund amount must be positive'
        }),

    reason: Joi.string().max(500).optional()
        .messages({
            'string.max': 'Reason must not exceed 500 characters'
        })
});

module.exports = {
    initiatePaymentSchema,
    processPaymentSchema,
    savePaymentMethodSchema,
    webhookSchema,
    refundSchema
};
