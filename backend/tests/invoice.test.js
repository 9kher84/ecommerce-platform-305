jest.mock("../services/eventLogService", () => ({
  appendEventLog: jest.fn().mockResolvedValue(true),
}));
jest.mock("../services/sanctionService", () => ({
  applySanction: jest.fn().mockResolvedValue(true),
}));

const request = require("supertest");
const app = require("../server");
const {
  Invoice,
  Deal,
  User,
  CommissionTransaction,
  sequelize,
} = require("../sequelize_setup");
const InvoiceService = require("../services/invoiceService");

describe("Invoice System Tests", () => {
  let testUserBuyer, testUserSeller, testDeal, testInvoice;
  let buyerToken, sellerToken;

  beforeAll(async () => {
    const r = Math.floor(Math.random() * 100000);

    // Assume users exist or create them
    testUserBuyer = await User.create({
      name: "Buyer Invoice Test " + r,
      email: `buyer_inv_${r}@test.com`,
      password: "Password123!",
      role: "buyer",
      subscriptionTier: "free",
    });

    testUserSeller = await User.create({
      name: "Seller Invoice Test " + r,
      email: `seller_inv_${r}@test.com`,
      password: "Password123!",
      role: "seller",
      subscriptionTier: "free",
    });

    // Dummy auth tokens (pseudo code for auth)
    const jwt = require("jsonwebtoken");
    buyerToken = jwt.sign(
      { id: testUserBuyer.id, role: "buyer" },
      process.env.JWT_SECRET || "test_secret",
    );
    sellerToken = jwt.sign(
      { id: testUserSeller.id, role: "seller" },
      process.env.JWT_SECRET || "test_secret",
    );

    // Mock Deal to bypass DB constraints
    testDeal = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      sellerId: testUserSeller.id,
      buyerId: testUserBuyer.id,
      finalAmount: 1000.0,
      status: "processing",
      buyer: testUserBuyer,
      seller: testUserSeller,
      save: jest.fn(),
    };

    jest.spyOn(Deal, "findByPk").mockResolvedValue(testDeal);
  });

  afterAll(async () => {
    await Invoice.destroy({ where: { buyerId: testUserBuyer.id } });
    await testUserBuyer.destroy();
    await testUserSeller.destroy();
  });

  it("should create an invoice from a Deal", async () => {
    const orderData = {
      taxAmount: 150.0,
      items: [{ description: "Test Item", price: 1000 }],
      buyer: { name: "Buyer Invoice Test" },
      seller: { name: "Seller Invoice Test" },
    };

    testInvoice = await InvoiceService.createInvoice(testDeal.id, orderData);

    expect(testInvoice).toBeDefined();
    expect(testInvoice.invoiceNumber).toMatch(/^INV-\d{4}-\d{4}-\d{4}$/);
    expect(testInvoice.token).toBeDefined();
    expect(testInvoice.status).toBe("pending");

    // Check deal lock
    expect(testDeal.deal_locked).toBe(true);
    expect(testDeal.invoice_id).toBe(testInvoice.id);
    expect(testDeal.save).toHaveBeenCalled();
  });

  it("should upload delivery proof and change status to awaiting_confirmation", async () => {
    const proofData = { fileUrl: "http://test.com/proof.jpg" };

    const res = await request(app)
      .post(`/api/invoice/${testInvoice.id}/proof`)
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({ files: proofData, description: "Delivered item" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("awaiting_confirmation");
  });

  it("should allow buyer to confirm delivery and change status to delivered", async () => {
    const res = await request(app)
      .post(`/api/invoice/${testInvoice.id}/confirm`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .send();

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("delivered");
  });

  it("should allow partial payment", async () => {
    testInvoice.status = "pending"; // Reset for payment test
    testInvoice.paidAmount = 0;
    await testInvoice.save();

    const updatedInvoice = await InvoiceService.markAsPaid(
      testInvoice.id,
      500,
      { receipt: "123" },
    );

    expect(updatedInvoice.paidAmount).toBe(500);
    expect(updatedInvoice.status).toBe("partially_paid");
  });

  it("should protect API from unauthorized access", async () => {
    const otherUser = await User.create({
      name: "Other",
      email: "other@test.com",
      password: "P12!",
      role: "buyer",
    });
    const jwt = require("jsonwebtoken");
    const otherToken = jwt.sign(
      { id: otherUser.id, role: "buyer" },
      process.env.JWT_SECRET || "test_secret",
    );

    const res = await request(app)
      .get(`/api/invoice/${testInvoice.id}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(res.status).toBe(403);
    await otherUser.destroy();
  });

  it("should mark invoice as overdue", async () => {
    testInvoice.status = "pending";
    testInvoice.dueDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // Past due
    await testInvoice.save();

    const updatedInvoice = await InvoiceService.markAsOverdue(testInvoice.id);

    expect(updatedInvoice.status).toBe("overdue");

    const updatedInvoice = await InvoiceService.markAsOverdue(testInvoice.id);

    expect(updatedInvoice.status).toBe("overdue");
  });
});
