const gatewayController = require("../../controllers/gatewayController");

describe("Omni-Channel Gateway Unit Suite (WhatsApp & Email Webhooks)", () => {
  test("1. WhatsApp Webhook Ingress: should process message and return structured execution plan", async () => {
    const req = {
      body: {
        from: "966501234567",
        message: "أحتاج شراء 100 طن حديد تسليح لمشروع الرياض"
      }
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await gatewayController.handleWhatsAppWebhook(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      channel: "WHATSAPP",
      sender: "966501234567"
    }));
  });

  test("2. Email Webhook Ingress: should process email subject/body and return execution plan", async () => {
    const req = {
      body: {
        fromEmail: "buyer@company.com",
        subject: "طلب توريد كيابل كهربائية",
        bodyText: "يرجى التوريد لمشروع جدة"
      }
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await gatewayController.handleEmailWebhook(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      channel: "EMAIL",
      sender: "buyer@company.com"
    }));
  });
});
