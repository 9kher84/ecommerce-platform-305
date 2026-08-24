const {
  Invoice,
  Deal,
  User,
  CommissionTransaction,
  SupervisorCommissionShare,
  FailedNotification,
  sequelize,
} = require("../sequelize_setup");
const AppError = require("../utils/appError");
const { appendEventLog } = require("./eventLogService");
const { updateTrustScore } = require("./trustScoreService");
const { applySanction } = require("./sanctionService");
const axios = require("axios");

class InvoiceService {
  /**
   * Create an invoice from an accepted deal
   */
  static async createInvoice(dealId, orderData = {}, options = {}) {
    const tx = options.transaction;
    const deal = await Deal.findByPk(dealId, {
      include: [
        { model: User, as: "buyer" },
        { model: User, as: "seller" },
      ],
      transaction: tx,
    });

    if (!deal) throw new AppError("Deal not found", 404);

    const dueDate = new Date();
    const dueDays = parseInt(process.env.INVOICE_DUE_DAYS) || 30;
    dueDate.setDate(dueDate.getDate() + dueDays);

    const autoCancelDate = new Date();
    const cancelDays = parseInt(process.env.INVOICE_AUTO_CANCEL_DAYS) || 45;
    autoCancelDate.setDate(autoCancelDate.getDate() + cancelDays);

    const invoiceData = {
      dealId: deal.id,
      buyerId: deal.buyerId,
      sellerId: deal.sellerId,
      status: "pending",
      dueDate,
      autoCancelDate,
      totalAmount: deal.finalAmount,
      taxAmount: orderData.taxAmount || 0,
      currency: "SAR",
      items: orderData.items || [],
      buyerSnapshot: orderData.buyer || {},
      sellerSnapshot: orderData.seller || {},
    };

    const invoice = await Invoice.create(invoiceData, { transaction: tx });

    // Update Deal
    deal.invoice_id = invoice.id;
    deal.deal_locked = true;
    await deal.save({ transaction: tx });

    // Send WhatsApp
    await this.sendInvoiceViaWhatsApp(
      invoice.token,
      deal.buyer,
      deal.seller,
      invoice,
    );

    await appendEventLog({
      actorId: deal.sellerId,
      actorRole: "seller",
      entityType: "invoice",
      entityId: invoice.uuid,
      actionType: "invoice_created",
      beforeState: null,
      afterState: { status: "pending" },
    });

    return invoice;
  }

  static async getInvoiceByToken(token) {
    const invoice = await Invoice.findOne({
      where: { token },
      include: [{ model: Deal, as: "deal" }],
    });

    if (!invoice) throw new AppError("Invoice not found or invalid token", 404);

    // Mask sensitive data
    const safeInvoice = invoice.toJSON();
    if (safeInvoice.buyerSnapshot && safeInvoice.buyerSnapshot.contactNumbers) {
      safeInvoice.buyerSnapshot.contactNumbers =
        safeInvoice.buyerSnapshot.contactNumbers.map(
          (n) => n.slice(0, 3) + "***" + n.slice(-4),
        );
    }
    if (safeInvoice.buyerSnapshot && safeInvoice.buyerSnapshot.email) {
      safeInvoice.buyerSnapshot.email = safeInvoice.buyerSnapshot.email.replace(
        /^(.)(.*)(.@.*)$/,
        (_, a, b, c) => a + b.replace(/./g, "*") + c,
      );
    }

    return safeInvoice;
  }

  static async getInvoiceById(id, userId, role) {
    const invoice = await Invoice.findByPk(id);
    if (!invoice) throw new AppError("Invoice not found", 404);

    if (
      role !== "admin" &&
      invoice.buyerId !== userId &&
      invoice.sellerId !== userId
    ) {
      throw new AppError("Unauthorized to view this invoice", 403);
    }

    return invoice;
  }

  static async markAsPaid(invoiceId, amount, proofData) {
    const invoice = await Invoice.findByPk(invoiceId);
    if (!invoice) throw new AppError("Invoice not found", 404);

    const oldStatus = invoice.status;
    let newPaid = parseFloat(invoice.paidAmount) + parseFloat(amount);
    invoice.paidAmount = newPaid;

    if (newPaid >= parseFloat(invoice.totalAmount)) {
      invoice.status = "paid";
    } else {
      invoice.status = "partially_paid";
    }

    if (proofData) {
      const currentProof = invoice.paymentProof || [];
      invoice.paymentProof = [...currentProof, proofData];
    }

    await invoice.save();

    await appendEventLog({
      actorId: invoice.buyerId,
      actorRole: "buyer",
      entityType: "invoice",
      entityId: invoice.uuid,
      actionType: "payment_added",
      beforeState: {
        status: oldStatus,
        paidAmount: invoice.paidAmount - amount,
      },
      afterState: { status: invoice.status, paidAmount: invoice.paidAmount },
    });

    return invoice;
  }

  static async markAsOverdue(invoiceId) {
    const invoice = await Invoice.findByPk(invoiceId);
    if (!invoice) throw new AppError("Invoice not found", 404);

    if (invoice.status === "pending" || invoice.status === "partially_paid") {
      const oldStatus = invoice.status;
      invoice.status = "overdue";
      await invoice.save();

      await appendEventLog({
        actorId: null,
        actorRole: "system",
        entityType: "invoice",
        entityId: invoice.uuid,
        actionType: "status_transition",
        beforeState: { status: oldStatus },
        afterState: { status: "overdue" },
      });

      // Apply sanction
      await applySanction(invoice.buyerId, "invoice_overdue");
    }

    return invoice;
  }

  static async cancelInvoice(invoiceId, reason, actorId) {
    const invoice = await Invoice.findByPk(invoiceId, { include: ["deal"] });
    if (!invoice) throw new AppError("Invoice not found", 404);

    const oldStatus = invoice.status;
    invoice.status = "cancelled";
    invoice.notes =
      (invoice.notes ? invoice.notes + "\n" : "") + `Cancelled: ${reason}`;
    await invoice.save();

    if (invoice.deal) {
      invoice.deal.status = "cancelled";
      invoice.deal.deal_locked = false;
      await invoice.deal.save();
    }

    await appendEventLog({
      actorId: actorId,
      actorRole: "user",
      entityType: "invoice",
      entityId: invoice.uuid,
      actionType: "status_transition",
      beforeState: { status: oldStatus },
      afterState: { status: "cancelled" },
    });

    return invoice;
  }

  static async linkDeliveryProof(invoiceId, proofData) {
    const invoice = await Invoice.findByPk(invoiceId);
    if (!invoice) throw new AppError("Invoice not found", 404);

    invoice.deliveryProof = proofData;
    const oldStatus = invoice.status;
    invoice.status = "pending_delivery_confirmation";
    await invoice.save();

    await appendEventLog({
      actorId: invoice.sellerId,
      actorRole: "seller",
      entityType: "invoice",
      entityId: invoice.uuid,
      actionType: "delivery_proof_linked",
      beforeState: { status: oldStatus },
      afterState: { status: invoice.status },
    });

    return invoice;
  }

  static async confirmDelivery(invoiceId, buyerId) {
    return await this.confirmDeliveryByBuyer(invoiceId, buyerId);
  }

  static async uploadDeliveryProof(invoiceId, files, description, userId) {
    const proofData = {
      files,
      description,
      timestamp: new Date(),
      userId,
    };
    const invoice = await this.linkDeliveryProof(invoiceId, proofData);
    // Change status to awaiting_confirmation
    invoice.status = "awaiting_confirmation";
    await invoice.save();
    return invoice;
  }

  static async confirmDeliveryByBuyer(invoiceId, buyerId) {
    const invoice = await Invoice.findByPk(invoiceId);
    if (!invoice) throw new AppError("Invoice not found", 404);

    if (invoice.buyerId !== buyerId) throw new AppError("Unauthorized", 403);

    const oldStatus = invoice.status;
    invoice.status = "delivered";
    await invoice.save();

    // Update Trust Score
    await updateTrustScore(invoice.buyerId);
    await updateTrustScore(invoice.sellerId);

    // Normally we'd mark as paid if it's COD
    // We'll leave it simple
    await appendEventLog({
      actorId: buyerId,
      actorRole: "buyer",
      entityType: "invoice",
      entityId: invoice.uuid,
      actionType: "delivery_confirmed",
      beforeState: { status: oldStatus },
      afterState: { status: "delivered" },
    });

    // Update Supervisor Commission Share
    if (invoice.dealId) {
      await SupervisorCommissionShare.update(
        { status: "paid", paid_at: new Date() },
        { where: { deal_id: invoice.dealId, status: "pending" } },
      );
    }

    return invoice;
  }

  static async sendInvoiceViaWhatsApp(token, buyer, seller, invoice) {
    const publicUrl = `https://sovereign.com/invoice/view/${token}`;
    const confirmUrl = `https://sovereign.com/invoice/confirm/${token}`;

    const msg = `🧾 فاتورة جديدة #${invoice.invoiceNumber}\n\nالمبلغ الإجمالي: ${invoice.totalAmount} ${invoice.currency}\nتاريخ الاستحقاق: ${new Date(invoice.dueDate).toLocaleDateString("ar-SA")}\n\nرابط الفاتورة: ${publicUrl}\n\nتأكيد الاستلام (للمشتري): ${confirmUrl}`;

    try {
      // Simulated call
      // await axios.post(process.env.OPENCLAW_WEBHOOK_URL, { to: buyer.contactNumbers?.[0], text: msg });
      console.log(
        `Sending to OpenClaw WhatsApp for Buyer (${buyer.contactNumbers?.[0]}):`,
        msg,
      );
      console.log(`Sending to OpenClaw WhatsApp for Seller:`, msg);
    } catch (e) {
      console.error("WhatsApp sending failed", e);
      if (buyer.contactNumbers?.[0]) {
        await FailedNotification.create({
          target_phone: buyer.contactNumbers[0],
          message: msg,
          error_log: e.message,
        });
      }
    }
  }
}

module.exports = InvoiceService;
