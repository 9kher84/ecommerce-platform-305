const asyncHandler = require("express-async-handler");
const NodeCache = require("node-cache");
const { SystemSetting } = require("../sequelize_setup");
const paymentService = require("../services/paymentService");
const { verifyWebhookSignature } = require("../utils/paymentSecurity");
const {
  logWebhookReceived,
  logSecurityAlert,
} = require("../utils/paymentAuditLogger");
const config = require("../config");

// Settings cache (5 minutes TTL)
const settingsCache = new NodeCache({ stdTTL: 300 });

/**
 * Helper: Check if payment system is enabled (with caching)
 */
async function isPaymentSystemEnabled() {
  let isEnabled = settingsCache.get("payment_system_enabled");

  if (isEnabled === undefined) {
    const setting = await SystemSetting.findOne({
      where: { key: "payment_system_enabled" },
    });
    isEnabled = setting && setting.value === "true";
    settingsCache.set("payment_system_enabled", isEnabled);
  }

  return isEnabled;
}

/**
 * @desc    Initiate a payment transaction
 * @route   POST /api/payment/initiate
 * @access  Protected
 */
exports.initiatePayment = asyncHandler(async (req, res) => {
  const isEnabled = await isPaymentSystemEnabled();

  if (!isEnabled) {
    res.status(503).json({
      success: false,
      message:
        "🏛️ نظام الدفع الإلكتروني جاهز وسيُفعّل قريباً بعد استكمال التصاريح الرسمية",
    });
    return;
  }

  const {
    dealId,
    amount,
    currency,
    paymentGateway,
    paymentMethodId,
    metadata,
  } = req.body;

  if (!dealId || !amount || !paymentGateway) {
    res.status(400);
    throw new Error("Missing required fields: dealId, amount, paymentGateway");
  }

  try {
    const initiationResult = await paymentService.initiatePayment(
      {
        dealId,
        userId: req.user.id,
        amount,
        currency: currency || "SAR",
        paymentGateway,
        paymentMethodId,
        metadata,
      },
      req,
    );

    res.status(201).json({
      success: true,
      message: "Payment initiated successfully",
      transaction: {
        id: initiationResult.transaction.id,
        transactionId: initiationResult.transactionId,
        amount: initiationResult.transaction.amount,
        currency: initiationResult.transaction.currency,
        status: initiationResult.status,
        gateway: initiationResult.transaction.paymentGateway,
        paymentUrl: initiationResult.paymentUrl, // Include paymentUrl
        qrCode: initiationResult.qrCode,
      },
    });
  } catch (error) {
    console.error("❌ Payment Initiation Error:", error); // Added for debugging
    await logSecurityAlert({
      action: "payment_initiation_failed",
      details: {
        userId: req.user.id,
        dealId,
        error: error.message, // Log full message
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      severity: "warning",
    });

    res.status(400).json({
      success: false,
      message: "فشل في بدء عملية الدفع. الرجاء المحاولة مرة أخرى.",
    });
  }
});

/**
 * @desc    Handle payment callback from gateway (Redirect after payment)
 * @route   ALL /api/payment/callback/:transactionId
 * @access  Public (Verified by transaction ID)
 */
exports.handleCallback = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;

  // Combine query params (GET) and body (POST) for maximum compatibility
  const callbackData = {
    ...req.query, // GET parameters from redirect
    ...req.body, // POST body if sent
  };

  const clientUrl = config.server.clientUrl;

  try {
    const updatedTransaction = await paymentService.handleCallback(
      transactionId,
      callbackData,
    );

    // Redirect user based on payment status
    if (updatedTransaction.status === "completed") {
      return res.redirect(`${clientUrl}/payment/success/${transactionId}`);
    } else if (updatedTransaction.status === "failed") {
      return res.redirect(`${clientUrl}/payment/failure/${transactionId}`);
    } else {
      return res.redirect(`${clientUrl}/payment/pending/${transactionId}`);
    }
  } catch (error) {
    await logSecurityAlert({
      action: "payment_callback_failed",
      details: {
        transactionId,
        error: error.message.substring(0, 100),
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      severity: "error",
    });

    return res.redirect(`${clientUrl}/payment/error/${transactionId}`);
  }
});

/**
 * @desc    Payment Webhook (from payment gateway - Server to Server)
 * @route   POST /api/payment/webhook
 * @access  Public (Verified by signature)
 */
exports.webhook = asyncHandler(async (req, res) => {
  const signature =
    req.headers["x-payment-signature"] || req.headers["x-webhook-signature"];
  // Use rawBody if available (from global middleware), otherwise fallback to stringified body (less reliable)
  const payload = req.rawBody ? req.rawBody : JSON.stringify(req.body);

  await logWebhookReceived(req.body.gateway || "unknown", req.body, signature);

  const webhookSecret = config.payment.webhookSecret;

  if (!webhookSecret) {
    console.error("[Webhook] PAYMENT_WEBHOOK_SECRET not configured");
    res.status(200).json({
      received: true,
      processed: false,
      error: "Webhook secret not configured",
    });
    return;
  }

  const isValid = verifyWebhookSignature(payload, signature, webhookSecret);

  if (!isValid) {
    await logSecurityAlert({
      action: "webhook_invalid_signature",
      details: { gateway: req.body.gateway, signature },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      severity: "critical",
    });

    res.status(401).json({
      received: false,
      error: "Invalid signature",
    });
    return;
  }

  const isEnabled = await isPaymentSystemEnabled();

  if (!isEnabled) {
    res.status(200).json({
      received: true,
      processed: false,
      message: "Payment system disabled",
    });
    return;
  }

  try {
    const result = await paymentService.handleWebhook(req.body, signature);

    res.status(200).json({
      received: true,
      processed: result.processed,
      message: "Webhook processed successfully",
    });
  } catch (error) {
    console.error("[Webhook] Processing error:", error);

    res.status(200).json({
      received: true,
      processed: false,
      error: error.message,
    });
  }
});

/**
 * @desc    Get Payment Status
 * @route   GET /api/payment/status/:transactionId
 * @access  Protected
 */
exports.getPaymentStatus = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;

  const isEnabled = await isPaymentSystemEnabled();

  if (!isEnabled) {
    res.status(503).json({
      success: false,
      message: "Service Unavailable",
    });
    return;
  }

  try {
    const transaction = await paymentService.getTransaction(transactionId);

    if (!transaction) {
      res.status(404).json({
        success: false,
        message: "لم يتم العثور على المعاملة",
      });
      return;
    }

    if (
      transaction.userId !== req.user.id &&
      req.user.role !== "admin" &&
      req.user.role !== "super_admin"
    ) {
      res.status(403).json({
        success: false,
        message: "غير مصرح لك بالوصول إلى هذه المعاملة",
      });
      return;
    }

    res.status(200).json({
      success: true,
      transaction: {
        id: transaction.id,
        transactionId: transaction.transactionId,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        gateway: transaction.paymentGateway,
        initiatedAt: transaction.initiatedAt,
        completedAt: transaction.completedAt,
        deal: transaction.deal,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "فشل في جلب حالة المعاملة",
    });
  }
});

/**
 * @desc    Cancel a pending payment
 * @route   POST /api/payment/cancel/:transactionId
 * @access  Protected
 */
exports.cancelPayment = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;

  try {
    const transaction = await paymentService.cancelPayment(
      transactionId,
      req.user.id,
    );

    res.status(200).json({
      success: true,
      message: "Payment cancelled successfully",
      transaction: {
        id: transaction.id,
        transactionId: transaction.transactionId,
        status: transaction.status,
      },
    });
  } catch (error) {
    await logSecurityAlert({
      action: "payment_cancellation_failed",
      details: {
        userId: req.user.id,
        transactionId,
        error: error.message.substring(0, 100),
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      severity: "warning",
    });

    res.status(400).json({
      success: false,
      message: "فشل في إلغاء المعاملة. الرجاء المحاولة مرة أخرى.",
    });
  }
});

/**
 * @desc    Save payment method
 * @route   POST /api/payment/methods
 * @access  Protected
 */
exports.savePaymentMethod = asyncHandler(async (req, res) => {
  const { type, provider, cardData, isDefault } = req.body;

  if (!type || !provider || !cardData) {
    res.status(400).json({
      success: false,
      message: "الحقول المطلوبة مفقودة",
    });
    return;
  }

  try {
    const paymentMethod = await paymentService.savePaymentMethod(req.user.id, {
      type,
      provider,
      cardData,
      isDefault,
    });

    res.status(201).json({
      success: true,
      message: "Payment method saved successfully",
      paymentMethod: {
        id: paymentMethod.id,
        type: paymentMethod.type,
        provider: paymentMethod.provider,
        lastFourDigits: paymentMethod.lastFourDigits,
        cardBrand: paymentMethod.cardBrand,
        isDefault: paymentMethod.isDefault,
      },
    });
  } catch (error) {
    await logSecurityAlert({
      action: "payment_method_save_failed",
      details: {
        userId: req.user.id,
        type,
        provider,
        error: error.message.substring(0, 100),
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      severity: "warning",
    });

    res.status(400).json({
      success: false,
      message: "فشل في حفظ طريقة الدفع. الرجاء المحاولة مرة أخرى.",
    });
  }
});

/**
 * @desc    Get user's payment methods
 * @route   GET /api/payment/methods
 * @access  Protected
 */
exports.getPaymentMethods = asyncHandler(async (req, res) => {
  try {
    const paymentMethods = await paymentService.getUserPaymentMethods(
      req.user.id,
    );

    res.status(200).json({
      success: true,
      count: paymentMethods.length,
      paymentMethods,
    });
  } catch (error) {
    res.status(400);
    throw new Error(error.message);
  }
});

/**
 * @desc    Delete payment method
 * @route   DELETE /api/payment/methods/:id
 * @access  Protected
 */
exports.deletePaymentMethod = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await paymentService.deletePaymentMethod(id, req.user.id);

    res.status(200).json({
      success: true,
      message: "Payment method deleted successfully",
    });
  } catch (error) {
    await logSecurityAlert({
      action: "payment_method_delete_failed",
      details: {
        userId: req.user.id,
        paymentMethodId: id,
        error: error.message.substring(0, 100),
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      severity: "warning",
    });

    res.status(400).json({
      success: false,
      message: "فشل في حذف طريقة الدفع. الرجاء المحاولة مرة أخرى.",
    });
  }
});
