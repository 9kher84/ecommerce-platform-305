const PaymentGatewayInterface = require("./PaymentGatewayInterface");
const crypto = require("crypto");

/**
 * Mada Payment Gateway Implementation
 * Saudi Arabia's national payment network
 */

class MadaGateway extends PaymentGatewayInterface {
  constructor(config) {
    super(config);
    this.gatewayName = "mada";

    // Mada-specific configuration
    this.merchantId = config.merchantId || process.env.MADA_MERCHANT_ID;
    this.apiKey = config.apiKey || process.env.MADA_API_KEY;
    this.webhookSecret =
      config.webhookSecret || process.env.MADA_WEBHOOK_SECRET;
    this.apiUrl =
      this.mode === "live"
        ? "https://api.mada.sa/v1"
        : "https://sandbox.mada.sa/v1";

    this.log("initialized", {
      mode: this.mode,
      apiUrl: this.apiUrl,
      merchantId: this.merchantId
        ? "***" + this.merchantId.slice(-4)
        : "not set",
    });
  }

  /**
   * Validate Mada configuration
   */
  validateConfig() {
    if (!this.merchantId) {
      throw new Error("Mada merchant ID is required");
    }
    if (!this.apiKey) {
      throw new Error("Mada API key is required");
    }
    if (!this.webhookSecret) {
      throw new Error("Mada webhook secret is required");
    }
    return true;
  }

  /**
   * Initiate payment with Mada
   */
  async initiatePayment(paymentData) {
    try {
      this.log("initiate_payment", {
        amount: paymentData.amount,
        currency: paymentData.currency,
      });

      // In test mode, return mock response
      if (this.mode === "test") {
        return this.getMockInitiateResponse(paymentData);
      }

      // Real Mada API integration would go here
      //     merchant_id: this.merchantId,
      //     amount: paymentData.amount,
      //     currency: paymentData.currency,
      //     callback_url: paymentData.callbackUrl,
      //     ...
      // });

      throw new Error("Live Mada integration not yet implemented");
    } catch (error) {
      this.handleError(error, "initiate_payment");
    }
  }

  /**
   * Verify payment callback from Mada
   */
  async verifyCallback(callbackData) {
    try {
      this.log("verify_callback", {
        transactionId: callbackData.transaction_id,
      });

      // In test mode, return mock verification
      if (this.mode === "test") {
        return this.getMockVerifyResponse(callbackData);
      }

      // Real verification would go here
      throw new Error("Live Mada integration not yet implemented");
    } catch (error) {
      this.handleError(error, "verify_callback");
    }
  }

  /**
   * Process webhook from Mada
   */
  async processWebhook(webhookData, signature) {
    try {
      this.log("process_webhook", {
        event: webhookData.event,
      });

      // Verify webhook signature
      if (!this.verifyWebhookSignature(webhookData, signature)) {
        throw new Error("Invalid webhook signature");
      }

      // In test mode, return mock response
      if (this.mode === "test") {
        return this.getMockWebhookResponse(webhookData);
      }

      // Real webhook processing would go here
      throw new Error("Live Mada integration not yet implemented");
    } catch (error) {
      this.handleError(error, "process_webhook");
    }
  }

  /**
   * Refund payment through Mada
   */
  async refundPayment(transactionId, amount) {
    try {
      this.log("refund_payment", {
        transactionId,
        amount,
      });

      // In test mode, return mock response
      if (this.mode === "test") {
        return this.getMockRefundResponse(transactionId, amount);
      }

      // Real refund would go here
      throw new Error("Live Mada integration not yet implemented");
    } catch (error) {
      this.handleError(error, "refund_payment");
    }
  }

  /**
   * Get payment status from Mada
   */
  async getPaymentStatus(gatewayTransactionId) {
    try {
      this.log("get_status", { gatewayTransactionId });

      // In test mode, return mock response
      if (this.mode === "test") {
        return this.getMockStatusResponse(gatewayTransactionId);
      }

      // Real status check would go here
      throw new Error("Live Mada integration not yet implemented");
    } catch (error) {
      this.handleError(error, "get_status");
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(data, signature) {
    if (this.mode === "test") {
      return true; // Skip verification in test mode
    }

    const payload = JSON.stringify(data);
    const expectedSignature = crypto
      .createHmac("sha256", this.webhookSecret)
      .update(payload)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  }

  // ==================== MOCK RESPONSES FOR TEST MODE ====================

  getMockInitiateResponse(paymentData) {
    return this.normalizeResponse({
      success: true,
      transactionId: paymentData.transactionId,
      gatewayTransactionId: `mada_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: "pending",
      amount: paymentData.amount,
      currency: paymentData.currency,
      paymentUrl: `https://sandbox.mada.sa/pay/${Date.now()}`,
      message: "Payment initiated successfully (TEST MODE)",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
    });
  }

  getMockVerifyResponse(callbackData) {
    const isSuccess = callbackData.success !== false;
    const res = this.normalizeResponse({
      success: isSuccess,
      transactionId: callbackData.transaction_id || callbackData.transactionId,
      gatewayTransactionId: callbackData.gateway_transaction_id || callbackData.gatewayTransactionId,
      status: isSuccess ? "completed" : "failed",
      amount: callbackData.amount,
      currency: callbackData.currency || "SAR",
      message: isSuccess ? "Payment verified successfully (TEST MODE)" : "Payment verification failed (TEST MODE)",
      cardBrand: "Mada",
      lastFourDigits: "1234",
    });
    res.success = isSuccess;
    return res;
  }

  getMockWebhookResponse(webhookData) {
    return {
      received: true,
      processed: true,
      event: webhookData.event,
      transactionId: webhookData.transaction_id,
      message: "Webhook processed successfully (TEST MODE)",
    };
  }

  getMockRefundResponse(transactionId, amount) {
    return this.normalizeResponse({
      success: true,
      transactionId,
      gatewayTransactionId: `mada_refund_${Date.now()}`,
      status: "refunded",
      amount,
      currency: "SAR",
      message: "Refund processed successfully (TEST MODE)",
    });
  }

  getMockStatusResponse(gatewayTransactionId) {
    return this.normalizeResponse({
      success: true,
      gatewayTransactionId,
      status: "completed",
      message: "Status retrieved successfully (TEST MODE)",
    });
  }
}

module.exports = MadaGateway;
