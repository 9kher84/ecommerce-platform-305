const DealLifecycleService = require("../../services/dealLifecycleService");
const FulfillmentAndWarrantyEngine = require("../../services/fulfillmentAndWarrantyEngine");
const DynamicCommissionEngine = require("../../services/dynamicCommissionEngine");
const { commercialTimelineEngine } = require("../../services/commercialTimelineEngine");

describe("Commercial Heart Operational Lock & Dynamic Engines Unit Suite", () => {
  test("1. Deal Lifecycle Service: should map 16 full journey stages and progress %", () => {
    const progress = DealLifecycleService.getJourneyProgress("INVOICE_GENERATED_AND_UNMASKED");
    expect(progress.progressPercent).toBeGreaterThan(40);
    expect(progress.totalStages).toBe(16);
  });

  test("2. Fulfillment & Warranty Engine: should file warranty claim and approve return decision", () => {
    const claim = FulfillmentAndWarrantyEngine.fileWarrantyClaim("deal-100", "buyer-1", { description: "Defective item" });
    expect(claim.status).toBe("WARRANTY_REVIEW");

    const decision = FulfillmentAndWarrantyEngine.processReturnDecision(claim.claimId, "APPROVE");
    expect(decision.status).toBe("RETURN_REFUND_HANDLED");
  });

  test("3. Dynamic Commission Engine: should calculate discounted commission from base 5% down to 3.4%", () => {
    const res = DynamicCommissionEngine.calculateDynamicCommission({
      dealAmountSAR: 100000,
      reputationScore: 4.9,
      completionRatePercent: 99,
      lifetimeVolumeSAR: 1500000
    });

    expect(res.baseRatePercent).toBe(5.0);
    expect(res.finalCommissionRatePercent).toBeLessThan(5.0);
    expect(res.commissionAmountSAR).toBe(3400); // 3.4% of 100,000 = 3400 SAR
  });

  test("4. Commercial Timeline Engine: should log append-only Git-like timeline commits", () => {
    const commit1 = commercialTimelineEngine.logCommit("deal-200", "buyer", "RFQ_CREATED");
    expect(commit1.commitHash).toBeDefined();

    const history = commercialTimelineEngine.getTimelineHistory("deal-200");
    expect(history.length).toBe(1);
  });
});
