// backend/routes/agentRoutes.js
const express = require("express");
const router = express.Router();
const axios = require("axios");
const LimitService = require("../services/limitService");
const ConfirmationService = require("../services/confirmationService");
const { PriceQuote, Product } = require("../sequelize_setup");
const { Op } = require("sequelize");

// Webhook لاستقبال الرسائل من هاتف Motorola
router.post("/webhook", async (req, res) => {
  try {
    const { from, message } = req.body;
    if (!message) return res.sendStatus(200);

    const text = message.trim();

    // 1. منطق "حدي"
    if (text === "حدي") {
      const info = await LimitService.getLimitInfo(from); // Using phone number as ID for now or lookup user by mobile
      // In real scenario: const user = await User.findOne({ where: { mobile: from } });
      // info = await LimitService.getLimitInfo(user.id);
      await sendWhatsAppMessage(
        from,
        `حدك الحالي هو: ${info.currentLimit} طلبات. لقد أكملت ${info.totalCompletedDeals} صفقات.`,
      );
    }

    // 2. منطق "استلمت [رقم الطلب]"
    else if (text.startsWith("استلمت ")) {
      const dealId = text.replace("استلمت ", "").trim();
      await ConfirmationService.confirmReceipt(dealId);
      await sendWhatsAppMessage(
        from,
        `تم تأكيد استلام الطلب رقم ${dealId} بنجاح. تم تحديث حد الطلبات النشطة الخاص بك.`,
      );
    }

    // 3. منطق "سعر [منتج]"
    else if (text.startsWith("سعر ")) {
      const productName = text.replace("سعر ", "").trim();
      const product = await Product.findOne({
        where: { name: { [Op.iLike]: `%${productName}%` } },
      });
      if (product) {
        await sendWhatsAppMessage(
          from,
          `سعر ${product.name} هو: ${product.price} ريال.`,
        );
      } else {
        await sendWhatsAppMessage(
          from,
          `عذراً، لم نجد منتجاً باسم ${productName}.`,
        );
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook Error:", error);
    res.sendStatus(500);
  }
});

// دالة إرسال الرسائل للهاتف (مع إضافة التوكن الأمني)
async function sendWhatsAppMessage(to, text) {
  const token =
    process.env.OPENCLAW_TOKEN ||
    "503ce76e7034f93360293b9c090bf69dbb35497afaaff09b";
  const openclawUrl = process.env.OPENCLAW_URL || "http://localhost:10789";

  try {
    await axios.post(
      `${openclawUrl}/api/send`,
      {
        to: to,
        message: text,
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
  } catch (error) {
    console.error("Error sending WhatsApp message:", error.message);
  }
}

module.exports = router;
