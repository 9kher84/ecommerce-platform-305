const CommercialDecisionEngine = require("../../services/commercialDecisionEngine");
const DynamicFeatureFlagEvaluator = require("../../services/dynamicFeatureFlagEvaluator");
const CommercialKpisEngine = require("../../services/commercialKpisEngine");

describe("Canonical 7-Layer Architecture Core Engines Unit Suite", () => {
  test("1. Commercial Decision Engine: should calculate score 100 and approve automated award", () => {
    const decision = CommercialDecisionEngine.makeCommercialDecision({
      isGoldSeller: true,
      sellerCommitmentRatePercent: 98.6,
      isVipBuyer: true,
      hasBackupSupplier: true
    });

    expect(decision.score).toBe(100);
    expect(decision.isAutoApproved).toBe(true);
  });

  test("2. Dynamic Feature Flag Evaluator: should evaluate complex multi-condition feature flags", () => {
    const flag = DynamicFeatureFlagEvaluator.evaluateDynamicFlag("AI_AUTO_NEGOTIATION", { aiConfidenceScore: 92 });
    expect(flag.isEnabled).toBe(true);

    const lowScoreFlag = DynamicFeatureFlagEvaluator.evaluateDynamicFlag("AI_AUTO_NEGOTIATION", { aiConfidenceScore: 70 });
    expect(lowScoreFlag.isEnabled).toBe(false);
  });

  test("3. Commercial KPIs Engine: should generate role-tailored KPIs for Seller, Buyer, and Admin", () => {
    const sellerKpis = CommercialKpisEngine.getRoleKpis("SELLER", "org-1");
    expect(sellerKpis.kpis.winRatePercent).toBeGreaterThan(40);

    const buyerKpis = CommercialKpisEngine.getRoleKpis("BUYER", "org-2");
    expect(buyerKpis.kpis.costSavingsPercent).toBeGreaterThan(10);

    const adminKpis = CommercialKpisEngine.getRoleKpis("ADMIN", "admin-1");
    expect(adminKpis.kpis.platformGmvSAR).toBeGreaterThan(100000000);
  });
});
