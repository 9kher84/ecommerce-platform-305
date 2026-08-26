const {
  PaymentTransaction,
  PaymentMethod,
  Deal,
  User,
} = require("../sequelize_setup");
const {
  generateTransactionId,
  tokenizePaymentData,
  generatePaymentToken,
} = require("../utils/paymentSecurity");
const {
  logPaymentInitiated,
  logPaymentCompleted,
  logPaymentFailed,
} = require("../utils/paymentAuditLogger");
const paymentGatewayFactory = require("../gateways/PaymentGatewayFactory");

/**
 * Payment Service Layer
 * Handles all payment-related business logic with SaaS Multi-Tenant support
 */

class PaymentService {
  constructor() {
    // Determine mode based on environment
    this.mode = process.env.NODE_ENV === "production" ? "live" : "test";
    this.webhookSecret =
      process.env.PAYMENT_WEBHOOK_SECRET || "dev_fallback_secret";

    console.log(
      `💳 Payment Service initialized in ${this.mode.toUpperCase()} mode`,
    );

    if (this.mode === "test") {
      console.log(
        "🔒 [TEST MODE] Payment system is ready but using test credentials",
      );
      console.log(
        "⚠️  Replace PAYMENT_WEBHOOK_SECRET and ENCRYPTION_KEY before production",
      );
    }
  }

  /**
   * Get merchant-specific configuration for a user's transaction.
   * In a real SaaS application, this would fetch the merchant's keys
   * from the database based on the userId or Deal.
   * @param {number} userId - ID of the user (or associated merchant)
   * @returns {object} - Gateway configuration (e.g., merchantId, apiKey)
   */
  getMerchantConfig(userId) {
    // TODO: Replace this mock implementation with a database fetch (e.g., from a Merchant table).
    // This allows different users/merchants to use different payment keys.

    if (this.mode === "test") {
      // In test mode, use general test environment variables
      return {};
    }

    // For live mode: A fallback config (Should be specific per merchant)
    return {
      madaMerchantId: process.env.MADA_MERCHANT_ID,
      madaApiKey: process.env.MADA_API_KEY,
      stcPayMerchantId: process.env.STC_PAY_MERCHANT_ID,
      stcPayApiKey: process.env.STC_PAY_API_KEY,
      applePayMerchantId: process.env.APPLE_PAY_MERCHANT_ID,
      applePayCertPath: process.env.APPLE_PAY_CERT_PATH,
    };
  }

  /**
   * Initialize a new payment transaction
   * @param {object} paymentData - Payment initialization data
   * @param {object} req - Express request object
   * @returns {Promise<object>} - Created payment transaction with payment URL
   */
  async initiatePayment(paymentData, req) {
    const {
      dealId,
      purchaseOrderId,
      invoiceId,
      userId,
      amount,
      currency = "SAR",
      paymentGateway,
      paymentMethodId,
      metadata,
    } = paymentData;

    if (!purchaseOrderId && !invoiceId && !dealId) {
      throw new Error("CANONICAL_PAYMENT_REQUIRED: Either purchaseOrderId, invoiceId, or dealId must be provided");
    }

    const { PurchaseOrder, Invoice, User: UserModel } = require("../sequelize_setup");
    let resolvedPoId = purchaseOrderId || null;
    let targetInvoice = null;

    if (invoiceId) {
      targetInvoice = await Invoice.findByPk(invoiceId);
      if (!targetInvoice) throw new Error(`Invoice ${invoiceId} not found`);
      if (parseFloat(targetInvoice.totalAmount) !== parseFloat(amount)) {
        throw new Error(`PAYMENT_AMOUNT_MISMATCH: Provided amount ${amount} does not match Invoice total ${targetInvoice.totalAmount}`);
      }
      if (targetInvoice.buyerId !== userId) {
        throw new Error("UNAUTHORIZED_PAYMENT: User does not own the target Invoice");
      }
      resolvedPoId = targetInvoice.purchaseOrderId || resolvedPoId;
    } else if (purchaseOrderId) {
      const targetPo = await PurchaseOrder.findByPk(purchaseOrderId);
      if (!targetPo) throw new Error(`PurchaseOrder ${purchaseOrderId} not found`);
      if (targetPo.buyerId !== userId) {
        throw new Error("UNAUTHORIZED_PAYMENT: User does not own the target PurchaseOrder");
      }
    }

    const user = await UserModel.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // 2. Get Merchant Config (SaaS support)
    const merchantConfig = this.getMerchantConfig(userId);

    // 3. Get Gateway Instance (using Factory Pattern)
    const gateway = paymentGatewayFactory.getGateway(
      paymentGateway,
      merchantConfig,
    );

    // 4. Prepare Gateway Payload
    const transactionId = generateTransactionId();
    const gatewayPayload = {
      transactionId,
      amount,
      currency,
      callbackUrl: `${process.env.CLIENT_URL}/payment/callback/${transactionId}`,
      referenceId: invoiceId || purchaseOrderId || dealId,
      customer: { id: userId, name: user.name, email: user.email },
    };

    // 5. Call Gateway API to Initiate Payment
    const gatewayResponse = await gateway.initiatePayment(gatewayPayload);

    const targetInvoiceId = invoiceId ? parseInt(invoiceId, 10) : null;

    // 6. Create Payment Transaction in DB
    const transaction = await PaymentTransaction.create({
      transactionId,
      dealId: dealId || null,
      purchaseOrderId: resolvedPoId,
      invoiceId: targetInvoiceId,
      userId,
      amount,
      currency,
      paymentMethodId,
      paymentGateway,
      status: "pending",
      gatewayTransactionId: gatewayResponse.gatewayTransactionId,
      gatewayResponse: JSON.stringify(gatewayResponse),
      initiatedAt: new Date(),
      metadata: { ...metadata, paymentUrl: gatewayResponse.paymentUrl },
      ipAddress: req?.ip,
      userAgent: req?.get ? req.get("user-agent") : null,
    });

    // 7. Log and Return
    if (req) {
      try {
        await logPaymentInitiated(transaction, req);
      } catch (logErr) {
        console.warn("[paymentService] Audit logging warning:", logErr.message);
      }
    }

    return {
      transactionId: transaction.transactionId,
      status: transaction.status,
      paymentUrl: gatewayResponse.paymentUrl || null,
      qrCode: gatewayResponse.qrCode || null,
      gatewayTransactionId: gatewayResponse.gatewayTransactionId,
      transaction,
    };
  }

  /**
   * Handle payment callback from gateway
   */
  async handleCallback(transactionId, callbackData) {
    const transaction = await PaymentTransaction.findOne({
      where: { transactionId },
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    // Idempotency: Return immediately if already completed
    if (transaction.status === "completed") {
      return transaction;
    }

    try {
      const merchantConfig = this.getMerchantConfig(transaction.userId);
      const gateway = paymentGatewayFactory.getGateway(
        transaction.paymentGateway,
        merchantConfig,
      );

      const verificationResult = await gateway.verifyCallback(callbackData);

      if (verificationResult.success) {
        const { Deal, Invoice, PurchaseOrder } = require("../sequelize_setup");

        if (transaction.invoiceId) {
          await Invoice.update({ status: "paid" }, { where: { id: transaction.invoiceId } });
        }
        if (transaction.purchaseOrderId) {
          await PurchaseOrder.update({ businessStatus: "paid" }, { where: { id: transaction.purchaseOrderId } });
        }
        if (transaction.dealId) {
          await Deal.update({ status: "paid" }, { where: { id: transaction.dealId } });
        }
      }

      transaction.status = verificationResult.success ? "completed" : "failed";
      transaction.gatewayResponse = JSON.stringify(verificationResult);
      transaction.completedAt = new Date();
      await transaction.save();

      if (verificationResult.success) {
        try {
          await logPaymentCompleted(transaction, verificationResult);
        } catch (logErr) {
          console.warn("[paymentService] Audit logging completed warning:", logErr.message);
        }
      } else {
        try {
          await logPaymentFailed(
            transaction,
            new Error("Payment verification failed"),
          );
        } catch (logErr) {}
      }

      return transaction;

      return transaction;
    } catch (error) {
      console.error("[paymentService] handleCallback error:", error);
      // Handle payment failure
      transaction.status = "failed";
      transaction.errorCode = error.code || "CALLBACK_ERROR";
      transaction.errorMessage = error.message;
      await transaction.save();

      await logPaymentFailed(transaction, error);
      throw error;
    }
  }

  /**
   * Get payment transaction by ID
   */
  async getTransaction(transactionId) {
    return await PaymentTransaction.findOne({
      where: { transactionId },
      include: [
        {
          model: Deal,
          as: "deal",
          attributes: ["id", "finalAmount", "status"],
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "name", "email"],
        },
      ],
    });
  }

  /**
   * Cancel a pending payment
   */
  async cancelPayment(transactionId, userId) {
    const transaction = await PaymentTransaction.findOne({
      where: { transactionId },
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    if (transaction.userId !== userId) {
      throw new Error("Unauthorized to cancel this transaction");
    }

    if (transaction.status !== "pending") {
      throw new Error(
        `Cannot cancel transaction with status: ${transaction.status}`,
      );
    }

    transaction.status = "cancelled";
    await transaction.save();

    return transaction;
  }

  /**
   * Save tokenized payment method
   */
  async savePaymentMethod(userId, paymentMethodData) {
    const { type, provider, cardData, isDefault = false } = paymentMethodData;

    // Generate token for storage
    const token = generatePaymentToken("pm_");

    // Create payment method
    const paymentMethod = await PaymentMethod.create({
      userId,
      type,
      provider,
      token,
      lastFourDigits: cardData.lastFour,
      cardBrand: cardData.brand,
      expiryMonth: cardData.expiryMonth,
      expiryYear: cardData.expiryYear,
      isDefault,
      isActive: true,
    });

    return paymentMethod;
  }

  /**
   * Get user's payment methods
   */
  async getUserPaymentMethods(userId) {
    return await PaymentMethod.findAll({
      where: { userId, isActive: true },
      attributes: [
        "id",
        "type",
        "provider",
        "lastFourDigits",
        "cardBrand",
        "expiryMonth",
        "expiryYear",
        "isDefault",
        "createdAt",
      ],
      order: [
        ["isDefault", "DESC"],
        ["createdAt", "DESC"],
      ],
    });
  }

  /**
   * Delete payment method
   */
  async deletePaymentMethod(paymentMethodId, userId) {
    const paymentMethod = await PaymentMethod.findByPk(paymentMethodId);

    if (!paymentMethod) {
      throw new Error("Payment method not found");
    }

    if (paymentMethod.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Soft delete by marking as inactive
    paymentMethod.isActive = false;
    await paymentMethod.save();

    return paymentMethod;
  }

  /**
   * Handle payment webhook from gateway (Server-to-Server)
   * @param {object} webhookData - Data from gateway webhook
   * @param {string} signature - Signature header for verification
   * @returns {Promise<object>} - Updated transaction or processing status
   */
  async handleWebhook(webhookData, signature) {
    const { transactionId, status } = webhookData;

    if (!transactionId || !status) {
      throw new Error("Webhook data missing transaction ID or status");
    }

    const transaction = await PaymentTransaction.findOne({
      where: { transactionId },
    });

    if (!transaction) {
      console.warn(`[Webhook] Transaction ${transactionId} not found.`);
      return { processed: true, message: "Transaction ID not found." };
    }

    // Get gateway instance
    const merchantConfig = this.getMerchantConfig(transaction.userId);
    const gatewayInstance = paymentGatewayFactory.getGateway(
      transaction.paymentGateway,
      merchantConfig,
    );

    // Process webhook using gateway-specific logic
    const processingResult = await gatewayInstance.processWebhook(
      webhookData,
      signature,
    );

    // Update transaction status based on result
    if (processingResult.success) {
      transaction.status = processingResult.status || "completed";
      transaction.completedAt = new Date();

      // Merge webhook data into gateway response
      const existingResponse = transaction.gatewayResponse
        ? JSON.parse(transaction.gatewayResponse)
        : {};
      transaction.gatewayResponse = JSON.stringify({
        ...existingResponse,
        webhook: webhookData,
      });

      await transaction.save();

      // ✅ تحديث حالة الصفقة عند نجاح الدفع عبر Webhook
      if (transaction.status === "completed") {
        await Deal.update(
          { status: "paid" },
          { where: { id: transaction.dealId } },
        );
        await logPaymentCompleted(transaction, processingResult);
      }
    } else if (processingResult.status === "failed") {
      await logPaymentFailed(
        transaction,
        new Error("Webhook reported payment failure"),
      );
      transaction.status = "failed";
      transaction.errorCode = processingResult.errorCode || "WEBHOOK_FAILURE";
      transaction.errorMessage =
        processingResult.message || "Payment failed via webhook";
      await transaction.save();
    }

    return { processed: true, transaction };
  }

  /**
   * Handle payment callback from gateway (Redirect)
   * @param {string} transactionId - Transaction ID
   * @param {object} callbackData - Data from gateway callback
   * @returns {Promise<object>} - Updated transaction
   */
  async handleCallback(transactionId, callbackData) {
    const transaction = await PaymentTransaction.findOne({
      where: { transactionId },
    });

    if (!transaction) {
      throw new Error("Transaction not found");
    }

    // Prevent double processing
    if (transaction.status === "completed") {
      console.log(`[Callback] Transaction ${transactionId} already completed.`);
      return transaction;
    }

    try {
      // Get gateway instance
      const merchantConfig = this.getMerchantConfig(transaction.userId);
      const gateway = paymentGatewayFactory.getGateway(
        transaction.paymentGateway,
        merchantConfig,
      );

      // Verify callback with gateway
      const verificationResult = await gateway.verifyCallback(callbackData);

      // Update transaction status
      transaction.status = verificationResult.success ? "completed" : "failed";
      transaction.gatewayResponse = JSON.stringify(verificationResult);
      transaction.completedAt = new Date();
      await transaction.save();

      // ✅ Update Invoice and PurchaseOrder status upon successful payment
      if (verificationResult.success) {
        const { Deal, Invoice, PurchaseOrder } = require("../sequelize_setup");

        if (transaction.invoiceId) {
          await Invoice.update({ status: "paid" }, { where: { id: transaction.invoiceId } });
        }
        if (transaction.purchaseOrderId) {
          await PurchaseOrder.update({ businessStatus: "paid" }, { where: { id: transaction.purchaseOrderId } });
        }
        if (transaction.dealId) {
          await Deal.update({ status: "paid" }, { where: { id: transaction.dealId } });
        }

        try {
          await logPaymentCompleted(transaction, verificationResult);
        } catch (logErr) {
          console.warn("[paymentService] Audit logging completed warning:", logErr.message);
        }
      } else {
        try {
          await logPaymentFailed(
            transaction,
            new Error("Payment verification failed"),
          );
        } catch (logErr) {}
      }

      return transaction;
    } catch (error) {
      console.error(
        `[Callback Error] Processing transaction ${transactionId}:`,
        error,
      );

      // Mark transaction as failed
      transaction.status = "failed";
      transaction.errorCode = error.code || "CALLBACK_ERROR";
      transaction.errorMessage = error.message;
      await transaction.save();

      await logPaymentFailed(transaction, error);
      throw error;
    }
  }
}

module.exports = new PaymentService();
