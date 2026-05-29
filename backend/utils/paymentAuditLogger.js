const { PaymentAuditLog } = require("../sequelize_setup");
const {
  encryptAuditDetails,
  sanitizeForLogging,
} = require("./paymentSecurity");

/**
 * Payment Audit Logger
 * Logs all payment-related activities for compliance and security
 */

/**
 * Log payment event
 * @param {object} eventData - Event data to log
 */
exports.logPaymentEvent = async (eventData) => {
  try {
    const {
      paymentTransactionId,
      userId,
      action,
      details,
      ipAddress,
      userAgent,
      gateway,
      gatewayTransactionId,
      severity = "info",
      metadata,
    } = eventData;

    // Sanitize details for logging (remove sensitive data)
    const sanitizedDetails = details ? sanitizeForLogging(details) : null;

    // Encrypt the sanitized details
    const encryptedDetails = sanitizedDetails
      ? encryptAuditDetails(sanitizedDetails)
      : null;

    // Create audit log entry
    await PaymentAuditLog.create({
      paymentTransactionId,
      userId,
      action,
      details: encryptedDetails,
      ipAddress,
      userAgent,
      gateway,
      gatewayTransactionId,
      severity,
      metadata,
    });

    console.log(`[Payment Audit] ${action} - User: ${userId || "system"}`);
  } catch (error) {
    console.error("[Payment Audit] Failed to log event:", error.message);
    // Don't throw - logging failure shouldn't break payment flow
  }
};

/**
 * Log payment initiation
 */
exports.logPaymentInitiated = async (transaction, req) => {
  await exports.logPaymentEvent({
    paymentTransactionId: transaction.id,
    userId: transaction.userId,
    action: "payment_initiated",
    details: {
      amount: transaction.amount,
      currency: transaction.currency,
      gateway: transaction.paymentGateway,
    },
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
    gateway: transaction.paymentGateway,
    gatewayTransactionId: transaction.transactionId,
    severity: "info",
  });
};

/**
 * Log payment completion
 */
exports.logPaymentCompleted = async (transaction, gatewayResponse) => {
  await exports.logPaymentEvent({
    paymentTransactionId: transaction.id,
    userId: transaction.userId,
    action: "payment_completed",
    details: {
      amount: transaction.amount,
      currency: transaction.currency,
      completedAt: transaction.completedAt,
    },
    gateway: transaction.paymentGateway,
    gatewayTransactionId: transaction.transactionId,
    severity: "info",
    metadata: { success: true },
  });
};

/**
 * Log payment failure
 */
exports.logPaymentFailed = async (transaction, error) => {
  await exports.logPaymentEvent({
    paymentTransactionId: transaction.id,
    userId: transaction.userId,
    action: "payment_failed",
    details: {
      errorCode: error.code || "UNKNOWN",
      errorMessage: error.message,
      amount: transaction.amount,
    },
    gateway: transaction.paymentGateway,
    gatewayTransactionId: transaction.transactionId,
    severity: "error",
    metadata: { error: true },
  });
};

/**
 * Log webhook received
 */
exports.logWebhookReceived = async (gateway, payload, signature) => {
  await exports.logPaymentEvent({
    action: "webhook_received",
    details: {
      gateway,
      signatureValid: !!signature,
      payloadSize: JSON.stringify(payload).length,
    },
    gateway,
    severity: "info",
  });
};

/**
 * Log security alert
 */
exports.logSecurityAlert = async (alertData) => {
  await exports.logPaymentEvent({
    ...alertData,
    action: "security_alert",
    severity: "critical",
  });
};

/**
 * Log fraud detection
 */
exports.logFraudDetected = async (transaction, reason) => {
  await exports.logPaymentEvent({
    paymentTransactionId: transaction.id,
    userId: transaction.userId,
    action: "fraud_detected",
    details: {
      reason,
      amount: transaction.amount,
      ipAddress: transaction.ipAddress,
    },
    gateway: transaction.paymentGateway,
    gatewayTransactionId: transaction.transactionId,
    severity: "critical",
    metadata: { fraud: true },
  });
};
