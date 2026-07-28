const ProcurementIntelligenceService = require("../../services/procurementIntelligenceService");
const NegotiationIntelligenceEngine = require("../../services/negotiationIntelligenceEngine");
const { Quotation } = require("../../sequelize_setup");

describe("Procurement Intelligence & Negotiation Intelligence Unit Suite", () => {
  const rfqId = "rfq-intel-100";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("1. Procurement Intelligence: should analyze quotations and recommend winning quote with AI reasoning", async () => {
    jest.spyOn(Quotation, "findAll").mockResolvedValue([
      { id: "q-1", sellerOrganizationId: "supp-1", totalAmount: 100000, deliveryDays: 5 },
      { id: "q-2", sellerOrganizationId: "supp-2", totalAmount: 120000, deliveryDays: 10 }
    ]);

    const result = await ProcurementIntelligenceService.analyzeAndRecommendWinner(rfqId);

    expect(result.success).toBe(true);
    expect(result.recommendation.recommendedQuoteId).toBe("q-1");
    expect(result.recommendation.aiScore).toBeGreaterThan(0);
    expect(result.auditedQuotes.length).toBe(2);
  });

  test("2. Negotiation Intelligence Engine: should evaluate counter-offer price and win probability", () => {
    const result = NegotiationIntelligenceEngine.evaluateCounterOffer({
      originalQuotePrice: 100000,
      targetBudget: 90000,
      currentRound: 1,
      strategy: "AGGRESSIVE"
    });

    expect(result.success).toBe(true);
    expect(result.analysis.recommendedCounterPrice).toBeLessThan(100000);
    expect(result.analysis.winProbabilityPercent).toBeGreaterThan(0);
  });
});
