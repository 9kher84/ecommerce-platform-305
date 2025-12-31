/**
 * Payment Gateway Interface
 * Base class that all payment gateway implementations must extend
 */

class PaymentGatewayInterface {
    constructor(config) {
        if (this.constructor === PaymentGatewayInterface) {
            throw new Error('PaymentGatewayInterface is abstract and cannot be instantiated directly');
        }

        this.config = config;
        this.mode = config.mode || 'test';
        this.gatewayName = 'unknown';
    }

    /**
     * Initialize payment transaction with gateway
     * @param {object} paymentData - Payment details
     * @returns {Promise<object>} - Gateway response with payment URL/token
     */
    async initiatePayment(paymentData) {
        throw new Error('initiatePayment() must be implemented by gateway');
    }

    /**
     * Verify payment callback from gateway
     * @param {object} callbackData - Data from gateway callback
     * @returns {Promise<object>} - Verified payment status
     */
    async verifyCallback(callbackData) {
        throw new Error('verifyCallback() must be implemented by gateway');
    }

    /**
     * Process webhook notification from gateway
     * @param {object} webhookData - Webhook payload
     * @param {string} signature - Webhook signature
     * @returns {Promise<object>} - Processed webhook result
     */
    async processWebhook(webhookData, signature) {
        throw new Error('processWebhook() must be implemented by gateway');
    }

    /**
     * Refund a completed payment
     * @param {string} transactionId - Original transaction ID
     * @param {number} amount - Amount to refund
     * @returns {Promise<object>} - Refund result
     */
    async refundPayment(transactionId, amount) {
        throw new Error('refundPayment() must be implemented by gateway');
    }

    /**
     * Get payment status from gateway
     * @param {string} gatewayTransactionId - Gateway's transaction ID
     * @returns {Promise<object>} - Payment status
     */
    async getPaymentStatus(gatewayTransactionId) {
        throw new Error('getPaymentStatus() must be implemented by gateway');
    }

    /**
     * Validate gateway configuration
     * @returns {boolean} - True if config is valid
     */
    validateConfig() {
        throw new Error('validateConfig() must be implemented by gateway');
    }

    /**
     * Normalize gateway response to standard format
     * @param {object} gatewayResponse - Raw gateway response
     * @returns {object} - Normalized response
     */
    normalizeResponse(gatewayResponse) {
        return {
            success: false,
            transactionId: null,
            gatewayTransactionId: null,
            status: 'unknown',
            amount: null,
            currency: null,
            message: null,
            rawResponse: gatewayResponse,
            gateway: this.gatewayName,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Log gateway interaction
     * @param {string} action - Action type
     * @param {object} data - Data to log
     */
    log(action, data) {
        const logData = {
            gateway: this.gatewayName,
            mode: this.mode,
            action,
            timestamp: new Date().toISOString(),
            ...data
        };

        if (this.mode === 'test') {
            console.log(`[${this.gatewayName.toUpperCase()}] ${action}:`, JSON.stringify(logData, null, 2));
        }
    }

    /**
     * Handle gateway errors
     * @param {Error} error - Error object
     * @param {string} context - Error context
     */
    handleError(error, context) {
        this.log('error', {
            context,
            error: error.message,
            stack: this.mode === 'test' ? error.stack : undefined
        });

        throw {
            gateway: this.gatewayName,
            context,
            message: error.message,
            code: error.code || 'GATEWAY_ERROR',
            originalError: this.mode === 'test' ? error : undefined
        };
    }
}

module.exports = PaymentGatewayInterface;
