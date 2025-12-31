const crypto = require('crypto');
const { encrypt, decrypt } = require('./securityUtils');

const ALGORITHM = 'aes-256-gcm';
const ENCODING = 'hex';

/**
 * Payment-specific encryption utilities
 * Implements PCI DSS requirements for payment data encryption
 */

/**
 * Generate a unique payment token
 * @param {string} prefix - Token prefix (e.g., 'pm_', 'tok_')
 * @returns {string} - Unique token
 */
exports.generatePaymentToken = (prefix = 'pm_') => {
    const randomBytes = crypto.randomBytes(32);
    const token = randomBytes.toString('base64')
        .replace(/\+/g, '')
        .replace(/\//g, '')
        .replace(/=/g, '')
        .substring(0, 32);
    return `${prefix}${token}`;
};

/**
 * Tokenize sensitive payment data
 * @param {object} paymentData - Payment data to tokenize
 * @returns {object} - { token, encryptedData }
 */
exports.tokenizePaymentData = (paymentData) => {
    if (!paymentData) {
        throw new Error('Payment data is required for tokenization');
    }

    // Generate unique token
    const token = exports.generatePaymentToken('tok_');

    // Encrypt the actual payment data
    const encryptedData = encrypt(JSON.stringify(paymentData));

    return {
        token,
        encryptedData
    };
};

/**
 * Detokenize payment data
 * @param {string} encryptedData - Encrypted payment data
 * @returns {object} - Decrypted payment data
 */
exports.detokenizePaymentData = (encryptedData) => {
    if (!encryptedData) {
        throw new Error('Encrypted data is required for detokenization');
    }

    const decryptedString = decrypt(encryptedData);
    return JSON.parse(decryptedString);
};

/**
 * Mask card number for display (PCI DSS compliant)
 * @param {string} cardNumber - Full card number
 * @returns {string} - Masked card number (e.g., ****1234)
 */
exports.maskCardNumber = (cardNumber) => {
    if (!cardNumber || cardNumber.length < 4) {
        return '****';
    }
    const lastFour = cardNumber.slice(-4);
    return `****${lastFour}`;
};

/**
 * Validate card number using Luhn algorithm
 * @param {string} cardNumber - Card number to validate
 * @returns {boolean} - True if valid
 */
exports.validateCardNumber = (cardNumber) => {
    if (!cardNumber) return false;

    // Remove spaces and dashes
    const cleaned = cardNumber.replace(/[\s-]/g, '');

    // Check if only digits
    if (!/^\d+$/.test(cleaned)) return false;

    // Luhn algorithm
    let sum = 0;
    let isEven = false;

    for (let i = cleaned.length - 1; i >= 0; i--) {
        let digit = parseInt(cleaned[i], 10);

        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }

        sum += digit;
        isEven = !isEven;
    }

    return sum % 10 === 0;
};

/**
 * Encrypt payment audit log details
 * @param {object} details - Audit log details
 * @returns {string} - Encrypted details
 */
exports.encryptAuditDetails = (details) => {
    if (!details) return null;
    return encrypt(JSON.stringify(details));
};

/**
 * Decrypt payment audit log details
 * @param {string} encryptedDetails - Encrypted details
 * @returns {object} - Decrypted details
 */
exports.decryptAuditDetails = (encryptedDetails) => {
    if (!encryptedDetails) return null;
    const decrypted = decrypt(encryptedDetails);
    return JSON.parse(decrypted);
};

/**
 * Generate secure transaction ID
 * @returns {string} - Unique transaction ID
 */
exports.generateTransactionId = () => {
    const timestamp = Date.now().toString(36);
    const randomPart = crypto.randomBytes(16).toString('hex');
    return `txn_${timestamp}_${randomPart}`;
};

/**
 * Sanitize payment data for logging (remove sensitive fields)
 * @param {object} paymentData - Payment data
 * @returns {object} - Sanitized data safe for logging
 */
exports.sanitizeForLogging = (paymentData) => {
    const sanitized = { ...paymentData };

    // Remove sensitive fields
    const sensitiveFields = [
        'cardNumber',
        'cvv',
        'pin',
        'password',
        'token',
        'encryptedData'
    ];

    sensitiveFields.forEach(field => {
        if (sanitized[field]) {
            sanitized[field] = '[REDACTED]';
        }
    });

    // Mask card number if present
    if (paymentData.cardNumber) {
        sanitized.cardNumberMasked = exports.maskCardNumber(paymentData.cardNumber);
    }

    return sanitized;
};

/**
 * Verify webhook signature (for payment gateway callbacks)
 * @param {string} payload - Webhook payload
 * @param {string} signature - Signature from gateway
 * @param {string} secret - Webhook secret
 * @returns {boolean} - True if signature is valid
 */
exports.verifyWebhookSignature = (payload, signature, secret) => {
    if (!payload || !signature || !secret) {
        return false;
    }

    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
    );
};
