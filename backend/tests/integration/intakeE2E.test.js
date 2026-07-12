const request = require("supertest");
const app = require("../../server");
const { sequelize } = require("../../sequelize_setup");

// We need to spy on the existing services loaded by the bootstrap
const pricingEngine = require("../../services/pricingEngine");
const MatchService = require("../../services/MatchService");
const notificationPolicyService = require("../../services/notificationPolicyService");
const inventoryEngine = require("../../services/inventoryEngine");

describe("Phase 3.5: Intake E2E Tests with CommercialWorkflowOrchestrator", () => {
  let server;
  beforeAll(async () => {
    process.env.PORT = 0; // Use random ephemeral port
    server = await app.startServer(true); // Start listening
    // Ensure category 1 exists for the test
    await sequelize.models.Category.findOrCreate({
      where: { id: 1 },
      defaults: { name: "Test Category", name_ar: "تجربة", name_en: "Test", description: "Test", isActive: true }
    });
  });

  afterAll(async () => {
    if (app.stopServer) await app.stopServer();
    await sequelize.close();
  });

  let token;
  let testUser;
  beforeEach(async () => {
    jest.clearAllMocks();
    testUser = await sequelize.models.User.create({
      name: "E2E Test User",
      email: `e2e-${Date.now()}@test.com`,
      password: "password123",
      role: "seller"
    });
    token = require("jsonwebtoken").sign({ id: testUser.id, role: "seller" }, process.env.JWT_SECRET || "supersecret12345678901234567890123", { expiresIn: "1h" });
  });

  afterEach(async () => {
    if (testUser) await testUser.destroy();
  });

  describe("E2E Supply Flow", () => {
    let dtoPayload;

    it("1. Should Analyze text and return DTO", async () => {
      const res = await request(server)
        .post("/api/intake/analyze")
        .set("Connection", "close")
        .set("Authorization", `Bearer ${token}`)
        .send({ text: "لدي 200 كرتون طماطم للبيع بسعر 50 للكرتون" });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.opportunity.type).toBe("SUPPLY");
      dtoPayload = res.body.opportunity;
    });

    it("2. Should Create Product and Orchestrate Services", async () => {
      // Setup Spies
      const spyPricing = jest.spyOn(pricingEngine, "generatePriceRecommendation").mockResolvedValue({ suggestedPrice: 55 });
      const spyNotification = jest.spyOn(notificationPolicyService, "processProductOpportunity").mockResolvedValue(true);
      const spyInventory = jest.spyOn(inventoryEngine, "analyzeInventoryPressure").mockResolvedValue([]);

      const res = await request(server)
        .post("/api/intake/create")
        .set("Connection", "close")
        .set("Authorization", `Bearer ${token}`)
        .send({
          opportunity: dtoPayload,
          categoryId: 1
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.recommendedPrice).toBe(55); // Added by Orchestrator

      // Verify the orchestrator workflow steps
      expect(res.body.workflowSteps).toContain("Create Product");
      expect(res.body.workflowSteps).toContain("Pricing");
      expect(res.body.workflowSteps).toContain("Notification");
      expect(res.body.workflowSteps).toContain("Inventory");

      // Verify Spies
      expect(spyPricing).toHaveBeenCalled();
      expect(spyNotification).toHaveBeenCalled();
      expect(spyInventory).toHaveBeenCalled();

      // Clean up
      await sequelize.models.Product.destroy({ where: { id: res.body.data.id } });
      spyPricing.mockRestore();
      spyNotification.mockRestore();
      spyInventory.mockRestore();
    });
  });

  describe("E2E Demand Flow", () => {
    let dtoPayload;

    it("1. Should Analyze text and return DTO", async () => {
      const res = await request(server)
        .post("/api/intake/analyze")
        .set("Connection", "close")
        .set("Authorization", `Bearer ${token}`)
        .send({ text: "مطلوب 1000 طن أسمنت" });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.opportunity.type).toBe("DEMAND");
      dtoPayload = res.body.opportunity;
    });

    it("2. Should Create PurchaseRequest and Orchestrate Services", async () => {
      // Setup Spies
      const spyMatch = jest.spyOn(MatchService, "findMatchesForRequest").mockResolvedValue([
        { inventoryId: 1, matchScore: 95 }
      ]);

      const res = await request(server)
        .post("/api/intake/create")
        .set("Connection", "close")
        .set("Authorization", `Bearer ${token}`)
        .send({
          opportunity: dtoPayload,
          categoryId: 1
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.matchesCount).toBe(1); // Added by MatchService mock

      // Verify Workflow Steps
      expect(res.body.workflowSteps).toContain("Create PurchaseRequest");
      expect(res.body.workflowSteps).toContain("Matching");
      expect(res.body.workflowSteps).toContain("Notification");

      // Verify Spies
      expect(spyMatch).toHaveBeenCalled();

      // Clean up
      await sequelize.models.PurchaseRequest.destroy({ where: { id: res.body.data.id } });
      spyMatch.mockRestore();
    });
  });
});
