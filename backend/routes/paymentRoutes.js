const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const { sovereignLimiter } = require("../middleware/rateLimitMiddleware");
const paymentController = require("../controllers/paymentController");

// ============================================================
// WEBHOOK SIGNATURE VERIFICATION
// ============================================================

/**
 * التحقق من توقيع Webhook من بوابة الدفع
 * يستخدم HMAC-SHA256 مع مفتاح سري مشترك
 */
const verifyWebhookSignature = (req) => {
  const crypto = require("crypto");
  const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;

  // في test mode، تخطي التحقق (للتطوير فقط)
  if (
    process.env.NODE_ENV === "development" &&
    process.env.SKIP_WEBHOOK_VERIFY === "true"
  ) {
    console.warn(
      "⚠️ [Webhook] Signature verification SKIPPED (development mode)",
    );
    return true;
  }

  if (!webhookSecret) {
    console.error("❌ [Webhook] PAYMENT_WEBHOOK_SECRET not configured");
    return false;
  }

  const signature =
    req.headers["x-webhook-signature"] ||
    req.headers["x-payment-signature"] ||
    req.headers["x-signature"];

  if (!signature) {
    console.warn("⚠️ [Webhook] No signature header found");
    return false;
  }

  // حساب التوقيع المتوقع
  const payload = req.rawBody || JSON.stringify(req.body);
  const expectedSig = crypto
    .createHmac("sha256", webhookSecret)
    .update(payload)
    .digest("hex");

  // مقارنة آمنة (timing-safe compare)
  try {
    const sigBuffer = Buffer.from(signature.replace("sha256=", ""), "hex");
    const expectedBuffer = Buffer.from(expectedSig, "hex");

    if (sigBuffer.length !== expectedBuffer.length) return false;
    return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
  } catch (err) {
    console.error("❌ [Webhook] Signature comparison error:", err.message);
    return false;
  }
};

// ============================================================
// PAYMENT INITIATION
// ============================================================

/**
 * @route   POST /api/payments/initiate
 * @desc    بدء عملية الدفع لصفقة
 * @access  Private (Buyer)
 */
router.post(
  "/initiate",
  protect,
  sovereignLimiter,
  paymentController.initiatePayment,
);

/**
 * @route   GET /api/payments/methods
 * @desc    جلب طرق الدفع المتاحة
 * @access  Private
 */
router.get("/methods", protect, paymentController.getPaymentMethods);

/**
 * @route   POST /api/payments/methods
 * @desc    إضافة طريقة دفع جديدة (tokenized)
 * @access  Private
 */
router.post(
  "/methods",
  protect,
  sovereignLimiter,
  paymentController.savePaymentMethod,
);

/**
 * @route   DELETE /api/payments/methods/:methodId
 * @desc    حذف طريقة دفع
 * @access  Private
 */
router.delete(
  "/methods/:methodId",
  protect,
  paymentController.deletePaymentMethod,
);

// ============================================================
// PAYMENT STATUS
// ============================================================

/**
 * @route   GET /api/payments/status/:dealId
 * @desc    جلب حالة الدفع لصفقة
 * @access  Private
 */
router.get("/status/:dealId", protect, async (req, res) => {
  try {
    const { Deal, PaymentTransaction } = require("../sequelize_setup");
    const deal = await Deal.findByPk(req.params.dealId, {
      include: [
        {
          model: PaymentTransaction,
          as: "transactions",
          order: [["createdAt", "DESC"]],
          limit: 1,
        },
      ],
    });

    if (!deal) {
      return res
        .status(404)
        .json({ success: false, message: "Deal not found" });
    }

    // التحقق من الصلاحية
    if (
      deal.buyerId !== req.user.id &&
      deal.sellerId !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const lastTransaction = deal.transactions && deal.transactions[0];

    return res.status(200).json({
      success: true,
      data: {
        dealId: deal.id,
        dealStatus: deal.status,
        finalAmount: deal.finalAmount,
        lastTransaction: lastTransaction
          ? {
              id: lastTransaction.id,
              status: lastTransaction.status,
              gateway: lastTransaction.paymentGateway,
              amount: lastTransaction.amount,
              createdAt: lastTransaction.createdAt,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("[Payment Status] Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

/**
 * @route   GET /api/payments/history
 * @desc    تاريخ معاملات المستخدم
 * @access  Private
 */
// router.get('/history', protect, paymentController.getTransactionHistory);

// ============================================================
// PAYMENT WEBHOOK — مع التحقق من التوقيع
// ============================================================

/**
 * @route   POST /api/payments/webhook
 * @desc    استقبال تأكيد الدفع من بوابة الدفع
 * @access  Public (Signature Verified)
 */
router.post("/webhook", async (req, res) => {
  try {
    // 🔐 التحقق من التوقيع — MANDATORY
    if (!verifyWebhookSignature(req)) {
      console.error(
        "🚨 [Payment Webhook] INVALID SIGNATURE — Rejecting request from IP:",
        req.ip,
      );
      return res.status(401).json({
        success: false,
        error: "Invalid webhook signature",
      });
    }

    const { transactionId, dealId, status, amount, currency } = req.body;

    console.log("[Payment Webhook] ✅ Verified request:", {
      transactionId,
      dealId,
      status,
      amount,
    });

    const { Deal, PaymentTransaction } = require("../sequelize_setup");
    const deal = await Deal.findByPk(dealId);

    if (!deal) {
      return res
        .status(404)
        .json({ success: false, message: "Deal not found" });
    }

    // تسجيل المعاملة
    try {
      await PaymentTransaction.create({
        transactionId: transactionId || `webhook_${Date.now()}`,
        dealId,
        userId: deal.buyerId || deal.sellerId,
        amount: parseFloat(amount || deal.finalAmount || 0),
        currency: currency || "SAR",
        paymentGateway: req.body.gateway || "test",
        status: ["success", "completed", "paid"].includes(status)
          ? "completed"
          : "failed",
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });
    } catch (txErr) {
      console.warn(
        "[Webhook] Could not create PaymentTransaction:",
        txErr.message,
      );
    }

    if (["success", "completed", "paid"].includes(status)) {
      await deal.update({
        status: "paid",
        notes:
          `${deal.notes || ""}\n[${new Date().toISOString()}] Payment confirmed: ${transactionId}`.trim(),
      });

      // إشعار الطرفين
      const NotificationService = require("../services/notificationService");
      if (deal.buyerId) {
        await NotificationService.sendToUser(
          deal.buyerId,
          "PAYMENT_CONFIRMED",
          {
            title: "تم تأكيد الدفع",
            message: `تم تأكيد دفعك للصفقة. المعاملة: ${transactionId}`,
          },
        );
      }
      if (deal.sellerId) {
        await NotificationService.sendToUser(
          deal.sellerId,
          "PAYMENT_RECEIVED",
          {
            title: "تم استلام الدفع",
            message: `تم استلام الدفع لصفقتك. سيتم التحويل خلال 24-48 ساعة.`,
          },
        );
      }

      console.log(`✅ [Payment Webhook] Deal ${dealId} marked as paid`);
      return res
        .status(200)
        .json({
          success: true,
          message: "Payment confirmed",
          data: { dealId, status: "paid" },
        });
    } else if (["failed", "cancelled"].includes(status)) {
      await deal.update({
        notes:
          `${deal.notes || ""}\n[${new Date().toISOString()}] Payment failed: ${transactionId}`.trim(),
      });
      console.log(`❌ [Payment Webhook] Deal ${dealId} payment failed`);
      return res
        .status(200)
        .json({
          success: true,
          message: "Payment status updated",
          data: { dealId, status: "failed" },
        });
    }

    return res
      .status(400)
      .json({ success: false, message: "Unknown payment status" });
  } catch (error) {
    console.error("[Payment Webhook] Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
