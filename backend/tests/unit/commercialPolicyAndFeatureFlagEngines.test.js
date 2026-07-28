const CommercialPolicyEngine = require("../../services/commercialPolicyEngine");
const FeatureFlagEngine = require("../../services/featureFlagEngine");
const MerchantLifecycleEngine = require("../../services/merchantLifecycleEngine");
const B2bRelationshipEngine = require("../../services/b2bRelationshipEngine");
const CommercialPackageService = require("../../services/commercialPackageService");

describe("Commercial Policy & Feature Flag Engines Unit Suite", () => {
  const orgId = "org-policy-100";

  test("1. Commercial Policy Engine: should evaluate ALLOW_AI_NEGOTIATIONS policy", async () => {
    const defaultRes = await CommercialPolicyEngine.evaluatePolicy(orgId, "ALLOW_AI_NEGOTIATIONS");
    expect(defaultRes.isAllowed).toBe(false);

    const enterpriseRes = await CommercialPolicyEngine.evaluatePolicy(orgId, "ALLOW_AI_NEGOTIATIONS", { tier: "ENTERPRISE" });
    expect(enterpriseRes.isAllowed).toBe(true);
  });

  test("2. Feature Flag Engine: should evaluate multi-dimensional flags and respects Owner Overrides", () => {
    const flag1 = FeatureFlagEngine.isFeatureEnabled("GOVERNMENT_TENDER", { verificationLevel: "GOLD" });
    expect(flag1.isEnabled).toBe(true);

    const flagOverride = FeatureFlagEngine.isFeatureEnabled("AI_AUTOMATION", { ownerOverrides: { AI_AUTOMATION: true } });
    expect(flagOverride.isEnabled).toBe(true);
  });

  test("3. Merchant Lifecycle Engine: should resolve Gold Supplier stage based on volume SAR 38M", () => {
    const stage = MerchantLifecycleEngine.resolveMerchantStage(120, 38000000);
    expect(stage.stage).toBe("GOLD");
    expect(stage.badge).toBe("GOLD_BADGE");
  });

  test("4. B2B Relationship Engine: should compute relational trust metrics between Supplier and Buyer", () => {
    const rel = B2bRelationshipEngine.getRelationshipMetrics("supp-1", "buyer-1");
    expect(rel.relationshipSummary.totalOrdersCount).toBe(126);
    expect(rel.relationshipSummary.partnershipTier).toBe("PLATINUM_PARTNER");
  });

  test("5. Commercial Package Service: should assemble unified Commercial Package with QR payload", () => {
    const pkg = CommercialPackageService.assembleCommercialPackage("deal-99");
    expect(pkg.status).toBe("PACKAGED_AND_VERIFIED");
    expect(pkg.documents.qrCodePayload).toContain("pkg-deal-99");
  });
});
