const request = require("supertest");
const app = require("../../server");
const { sequelize } = require("../../sequelize_setup");
const { orchestrator } = require("../../bootstrap/intakeEngine.bootstrap").createIntakeEngineComposition();

describe("Phase 3.95 - Production Hardening - Rollback Tests", () => {
  let server;

  beforeAll(async () => {
    server = await app.startServer(false); // start without listening
    // Ensure test categories exist
    await sequelize.models.Category.findOrCreate({
      where: { id: 1 },
      defaults: { name: "Test Category", name_ar: "Test", name_en: "Test", isActive: true, type: "SECTOR" }
    });
  });

  afterAll(async () => {
    if (app.stopServer) await app.stopServer();
    await sequelize.close();
  });

  it("should rollback Product Creation if Pricing fails (CRITICAL SERVICE)", async () => {
    // We mock Pricing Engine to throw an error
    const originalGeneratePrice = orchestrator.pricingEngine.generatePriceRecommendation;
    orchestrator.pricingEngine.generatePriceRecommendation = jest.fn().mockRejectedValue(new Error("MOCK_PRICING_FAILURE"));

    const opportunity = {
      type: "SUPPLY",
      categoryId: 1,
      details: { productName: "Test Rollback Product", quantity: 10, price: 100 }
    };

    const context = { userId: "123e4567-e89b-12d3-a456-426614174000", correlationId: "test-correlation" };

    // Record count before
    const countBefore = await sequelize.models.Product.count();

    try {
      await orchestrator.executeWorkflow(opportunity, { isValid: true }, context);
    } catch (error) {
      expect(error.message).toBe("MOCK_PRICING_FAILURE");
    }

    // Record count after
    const countAfter = await sequelize.models.Product.count();

    // Assert NO new product was created (rolled back)
    expect(countAfter).toBe(countBefore);

    // Restore
    orchestrator.pricingEngine.generatePriceRecommendation = originalGeneratePrice;
  });

  it("should CONTINUE and not rollback if Notification fails (NON-CRITICAL SERVICE)", async () => {
    // We mock Notification Policy to throw an error
    const originalNotify = orchestrator.notificationPolicyService.processProductOpportunity;
    orchestrator.notificationPolicyService.processProductOpportunity = jest.fn().mockRejectedValue(new Error("MOCK_NOTIFICATION_FAILURE"));

    const opportunity = {
      type: "SUPPLY",
      categoryId: 1,
      details: { productName: "Test Success Product", quantity: 10, price: 100 }
    };

    const context = { userId: "123e4567-e89b-12d3-a456-426614174000", correlationId: "test-correlation-2" };

    const result = await orchestrator.executeWorkflow(opportunity, { isValid: true }, context);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();

    // Verify it WAS created
    const productExists = await sequelize.models.Product.findOne({ where: { id: result.data.id } });
    expect(productExists).not.toBeNull();

    // Restore
    orchestrator.notificationPolicyService.processProductOpportunity = originalNotify;
  });
});
