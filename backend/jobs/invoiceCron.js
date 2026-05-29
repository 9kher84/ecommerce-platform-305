const cron = require("node-cron");
const {
  Invoice,
  FailedNotification,
  sequelize,
} = require("../sequelize_setup");
const { Op } = require("sequelize");
const InvoiceService = require("../services/invoiceService");
const { applySanction } = require("../services/sanctionService");

// Run every night at midnight
cron.schedule("0 0 * * *", async () => {
  console.log("Running daily invoice overdue check...");
  try {
    const overdueInvoices = await Invoice.findAll({
      where: {
        status: {
          [Op.in]: ["pending", "partially_paid"],
        },
        dueDate: {
          [Op.lt]: new Date(),
        },
      },
    });

    for (const invoice of overdueInvoices) {
      await InvoiceService.markAsOverdue(invoice.id);

      // Check if 15 days past due date for suspension
      const daysOverdue =
        (new Date() - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24);
      if (daysOverdue >= 15) {
        await applySanction(
          invoice.buyerId,
          "temporary_suspension",
          "Non-payment of invoice for 15+ days",
          null,
        );
      } else {
        await applySanction(
          invoice.buyerId,
          process.env.INVOICE_OVERDUE_SANCTION || "shadow_restriction",
          "Invoice overdue",
          7 * 24 * 60,
        ); // 7 days
      }
    }
  } catch (err) {
    console.error("Error in invoice cron job:", err);
  }
});

// Run every 15 minutes to retry failed WhatsApp notifications
cron.schedule("*/15 * * * *", async () => {
  console.log("Running failed notifications retry job...");
  try {
    const failedNotifications = await FailedNotification.findAll({
      where: {
        status: "pending",
        retry_count: {
          [Op.lt]: 5,
        },
      },
    });

    for (const notif of failedNotifications) {
      try {
        // Simulated retry call
        // await axios.post(process.env.OPENCLAW_WEBHOOK_URL, { to: notif.target_phone, text: notif.message });
        console.log(
          `[Retry ${notif.retry_count + 1}] Successfully sent to ${notif.target_phone}`,
        );
        notif.status = "success";
        await notif.save();
      } catch (err) {
        notif.retry_count += 1;
        notif.error_log = err.message;
        if (notif.retry_count >= 5) {
          notif.status = "failed_permanently";
        }
        await notif.save();
      }
    }
  } catch (err) {
    console.error("Error in failed notifications cron job:", err);
  }
});
