const PaymentGatewayInterface = require('./PaymentGatewayInterface');
const crypto = require('crypto');

/**
 * STC Pay Gateway Implementation
 * Saudi Telecom Company's digital wallet
 */

class STCPayGateway extends PaymentGatewayInterface {
    constructor(config) {
        super(config);
        this.gatewayName = 'stc_pay';

        // STC Pay-specific configuration
        this.merchantId = config.merchantId || process.env.STC_PAY_MERCHANT_ID;
        this.apiKey = config.apiKey || process.env.STC_PAY_API_KEY;
        this.webhookSecret = config.webhookSecret || process.env.STC_PAY_WEBHOOK_SECRET;
        this.apiUrl = this.mode === 'live'
            ? 'https://api.stcpay.com.sa/v2'
            : 'https://sandbox.stcpay.com.sa/v2';

        this.log('initialized', {
            mode: this.mode,
            apiUrl: this.apiUrl,
            merchantId: this.merchantId ? '***' + this.merchantId.slice(-4) : 'not set'
        });
    }

    /**
     * Validate STC Pay configuration
     */
    validateConfig() {
        if (!this.merchantId) {
            throw new Error('STC Pay merchant ID is required');
        }
        if (!this.apiKey) {
            throw new Error('STC Pay API key is required');
        }
        if (!this.webhookSecret) {
            throw new Error('STC Pay webhook secret is required');
        }
        return true;
    }

    /**
     * Initiate payment with STC Pay
     */
    async initiatePayment(paymentData) {
        try {
            this.log('initiate_payment', {
                amount: paymentData.amount,
                currency: paymentData.currency
            });

            // In test mode, return mock response
            if (this.mode === 'test') {
                return this.getMockInitiateResponse(paymentData);
            }

            // Real STC Pay API integration would go here
            throw new Error('Live STC Pay integration not yet implemented');
        } catch (error) {
            this.handleError(error, 'initiate_payment');
        }
    }

    /**
     * Verify payment callback from STC Pay
     */
    async verifyCallback(callbackData) {
        try {
            this.log('verify_callback', {
                transactionId: callbackData.transaction_id
            });

            // In test mode, return mock verification
            if (this.mode === 'test') {
                return this.getMockVerifyResponse(callbackData);
            }

            // Real verification would go here
            throw new Error('Live STC Pay integration not yet implemented');
        } catch (error) {
            this.handleError(error, 'verify_callback');
        }
    }

    /**
     * Process webhook from STC Pay
     */
    async processWebhook(webhookData, signature) {
        try {
            this.log('process_webhook', {
                event: webhookData.event
            });

            // Verify webhook signature
            if (!this.verifyWebhookSignature(webhookData, signature)) {
                throw new Error('Invalid webhook signature');
            }

            // In test mode, return mock response
            if (this.mode === 'test') {
                return this.getMockWebhookResponse(webhookData);
            }

            // Real webhook processing would go here
            throw new Error('Live STC Pay integration not yet implemented');
        } catch (error) {
            this.handleError(error, 'process_webhook');
        }
    }

    /**
     * Refund payment through STC Pay
     */
    async refundPayment(transactionId, amount) {
        try {
            this.log('refund_payment', {
                transactionId,
                amount
            });

            // In test mode, return mock response
            if (this.mode === 'test') {
                return this.getMockRefundResponse(transactionId, amount);
            }

            // Real refund would go here
            throw new Error('Live STC Pay integration not yet implemented');
        } catch (error) {
            this.handleError(error, 'refund_payment');
        }
    }

    /**
     * Get payment status from STC Pay
     */
    async getPaymentStatus(gatewayTransactionId) {
        try {
            this.log('get_status', { gatewayTransactionId });

            // In test mode, return mock response
            if (this.mode === 'test') {
                return this.getMockStatusResponse(gatewayTransactionId);
            }

            // Real status check would go here
            throw new Error('Live STC Pay integration not yet implemented');
        } catch (error) {
            this.handleError(error, 'get_status');
        }
    }

    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(data, signature) {
        if (this.mode === 'test') {
            return true; // Skip verification in test mode
        }

        const payload = JSON.stringify(data);
        const expectedSignature = crypto
            .createHmac('sha256', this.webhookSecret)
            .update(payload)
            .digest('hex');

        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    }

    // ==================== MOCK RESPONSES FOR TEST MODE ====================

    getMockInitiateResponse(paymentData) {
        return this.normalizeResponse({
            success: true,
            transactionId: paymentData.transactionId,
            gatewayTransactionId: `stc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: 'pending',
            amount: paymentData.amount,
            currency: paymentData.currency,
            paymentUrl: `stcpay://pay?ref=${Date.now()}`, // Deep link for STC Pay app
            qrCode: `https://sandbox.stcpay.com.sa/qr/${Date.now()}`,
            message: 'Payment initiated successfully (TEST MODE)',
            expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
        });
    }

    getMockVerifyResponse(callbackData) {
        return this.normalizeResponse({
            success: true,
            transactionId: callbackData.transaction_id,
            gatewayTransactionId: callbackData.gateway_transaction_id,
            status: 'completed',
            amount: callbackData.amount,
            currency: callbackData.currency || 'SAR',
            message: 'Payment verified successfully (TEST MODE)',
            walletType: 'STC Pay'
        });
    }

    getMockWebhookResponse(webhookData) {
        return {
            received: true,
            processed: true,
            event: webhookData.event,
            transactionId: webhookData.transaction_id,
            message: 'Webhook processed successfully (TEST MODE)'
        };
    }

    getMockRefundResponse(transactionId, amount) {
        return this.normalizeResponse({
            success: true,
            transactionId,
            gatewayTransactionId: `stc_refund_${Date.now()}`,
            status: 'refunded',
            amount,
            currency: 'SAR',
            message: 'Refund processed successfully (TEST MODE)'
        });
    }

    getMockStatusResponse(gatewayTransactionId) {
        return this.normalizeResponse({
            success: true,
            gatewayTransactionId,
            status: 'completed',
            message: 'Status retrieved successfully (TEST MODE)'
        });
    }
}

module.exports = STCPayGateway;
