const express = require("express");
const router = express.Router();
const gatewayController = require("../controllers/gatewayController");

router.post("/whatsapp", gatewayController.handleWhatsAppWebhook);
router.post("/email", gatewayController.handleEmailWebhook);

module.exports = router;
