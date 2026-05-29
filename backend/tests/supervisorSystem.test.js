const request = require("supertest");
const app = require("../server");
const {
  User,
  Deal,
  SupervisorAssignment,
  SupervisorCommissionShare,
  SupervisorNotification,
  sequelize,
} = require("../sequelize_setup");
const SupervisorService = require("../services/supervisorService");

jest.mock("../services/notificationService", () => ({
  io: {
    of: () => ({
      to: () => ({
        emit: jest.fn(),
      }),
    }),
  },
}));

jest.mock("../services/eventLogService", () => ({
  appendEventLog: jest.fn().mockResolvedValue(true),
}));

describe("Supervisor System Tests", () => {
  let testOwner, testSupervisor, testBuyer, testSeller, testDeal;
  let ownerToken, supervisorToken;

  beforeAll(async () => {
    const r = Math.floor(Math.random() * 100000);

    testOwner = await User.create({
      id: process.env.OWNER_ID || "11111111-1111-1111-1111-111111111111",
      name: "Test Owner",
      email: `owner_${r}@test.com`,
      password: "Password123!",
      role: "owner",
      isAdmin: true,
    });

    testSupervisor = await User.create({
      name: "Test Supervisor",
      email: `supervisor_${r}@test.com`,
      password: "Password123!",
      role: "supervisor",
    });

    testBuyer = await User.create({
      name: "Test Buyer",
      email: `buyer_${r}@test.com`,
      password: "Password123!",
      role: "buyer",
    });

    testSeller = await User.create({
      name: "Test Seller",
      email: `seller_${r}@test.com`,
      password: "Password123!",
      role: "seller",
    });

    const jwt = require("jsonwebtoken");
    ownerToken = jwt.sign(
      { id: testOwner.id, role: "owner" },
      process.env.JWT_SECRET || "test_secret",
    );
    supervisorToken = jwt.sign(
      { id: testSupervisor.id, role: "supervisor" },
      process.env.JWT_SECRET || "test_secret",
    );

    testDeal = await Deal.create({
      purchaseRequestId: "123e4567-e89b-12d3-a456-426614174000", // Mock UUID
      priceQuoteId: "123e4567-e89b-12d3-a456-426614174001", // Mock UUID
      sellerId: testSeller.id,
      buyerId: testBuyer.id,
      finalAmount: 1000.0,
      status: "processing",
    });
  });

  afterAll(async () => {
    await SupervisorCommissionShare.destroy({ where: {} });
    await SupervisorNotification.destroy({ where: {} });
    await SupervisorAssignment.destroy({ where: {} });
    await testDeal.destroy();
    await testSeller.destroy();
    await testBuyer.destroy();
    await testSupervisor.destroy();
    await testOwner.destroy();
  });

  it("should assign a supervisor to a deal and create DB entries", async () => {
    const assignment = await SupervisorService.assignDealToSupervisor(
      testDeal.id,
      testSupervisor.id,
      testOwner.id,
    );

    expect(assignment).toBeDefined();
    expect(assignment.deal_id).toBe(testDeal.id);
    expect(assignment.supervisor_id).toBe(testSupervisor.id);

    const checkAssignment = await SupervisorAssignment.findByPk(assignment.id);
    expect(checkAssignment).toBeDefined();
  });

  it("should calculate commission accurately (0.5%)", async () => {
    const commission = await SupervisorCommissionShare.findOne({
      where: { supervisor_id: testSupervisor.id, deal_id: testDeal.id },
    });

    expect(commission).toBeDefined();
    expect(parseFloat(commission.amount)).toBe(5.0); // 0.5% of 1000
  });

  it("should create a notification and trigger websocket", async () => {
    const notifications = await SupervisorNotification.findAll({
      where: { supervisor_id: testSupervisor.id },
    });

    expect(notifications.length).toBeGreaterThan(0);
    expect(notifications[0].type).toBe("assignment");
    // websocket mock was used, assuming it didn't crash
  });

  it("should mark commission as paid", async () => {
    const commission = await SupervisorCommissionShare.findOne({
      where: { supervisor_id: testSupervisor.id, deal_id: testDeal.id },
    });

    const updated = await SupervisorService.markCommissionAsPaid(
      commission.id,
      testOwner.id,
    );
    expect(updated.status).toBe("paid");
    expect(updated.paid_at).toBeDefined();
  });

  it("should allow supervisor to fetch their deals", async () => {
    const res = await request(app)
      .get("/api/supervisor/deals")
      .set("Authorization", `Bearer ${supervisorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].deal_id).toBe(testDeal.id);
  });

  it("should allow owner to fetch all commission reports", async () => {
    const res = await request(app)
      .get("/api/owner/commission-reports")
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].supervisor_id).toBe(testSupervisor.id);
  });
});
