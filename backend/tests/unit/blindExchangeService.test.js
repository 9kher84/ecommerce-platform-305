const BlindExchangeService = require("../../services/blindExchangeService");

describe("Blind Procurement Exchange Service Unit Suite", () => {
  const sellerOrgId = "org-seller-100";

  test("1. Blind Identity Model: should strip seller details when viewed by buyer prior to Invoice phase", () => {
    const rawQuote = {
      id: "q-1",
      price: 50000,
      sellerOrganizationId: "org-seller-999",
      sellerPhone: "0500000000",
      sellerEmail: "seller@test.com"
    };

    const sanitizedForBuyer = BlindExchangeService.sanitizeBlindData(rawQuote, "BUYER", false);
    expect(sanitizedForBuyer.price).toBe(50000);
    expect(sanitizedForBuyer.sellerPhone).toBeUndefined();
    expect(sanitizedForBuyer.sellerEmail).toBeUndefined();
  });

  test("2. Blind Identity Model: should unmask identity details during Invoice phase", () => {
    const rawQuote = {
      id: "q-1",
      price: 50000,
      sellerOrganizationId: "org-seller-999",
      sellerPhone: "0500000000",
      sellerEmail: "seller@test.com"
    };

    const unmasked = BlindExchangeService.sanitizeBlindData(rawQuote, "BUYER", true);
    expect(unmasked.sellerPhone).toBe("0500000000");
  });

  test("3. Backup Supplier Cascade: should trigger cascade to Backup 1 if Primary rejects", async () => {
    const result = await BlindExchangeService.processSellerAcceptance("award-100", "NO");
    expect(result.success).toBe(true);
    expect(result.status).toBe("cascaded_to_backup_1");
  });

  test("4. Commission Suspension Rule: should suspend seller account if unpaid commissions reach 3", async () => {
    const resActive = await BlindExchangeService.checkAndApplyCommissionSuspension(sellerOrgId, 2);
    expect(resActive.isSuspended).toBe(false);

    const resSuspended = await BlindExchangeService.checkAndApplyCommissionSuspension(sellerOrgId, 3);
    expect(resSuspended.isSuspended).toBe(true);
    expect(resSuspended.accountStatus).toBe("SUSPENDED");
  });

  test("5. Professional Portfolio Schema: should return lifetime reputation and volume metrics", () => {
    const portfolio = BlindExchangeService.getProfessionalPortfolio("user-100", sellerOrgId);
    expect(portfolio.portfolioMetrics.exportableForHR).toBe(true);
    expect(portfolio.portfolioMetrics.reputationScore).toBeGreaterThan(4);
  });
});
