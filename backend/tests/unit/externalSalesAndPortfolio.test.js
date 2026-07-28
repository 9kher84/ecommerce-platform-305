const { externalSalesVerificationService } = require("../../services/externalSalesVerificationService");
const CommercialPortfolioService = require("../../services/commercialPortfolioService");

describe("External Sales Verification & Commercial Portfolio Unit Suite", () => {
  const sellerOrgId = "org-portfolio-100";

  test("1. External Sales Verification: should verify valid invoice and extract price intelligence", async () => {
    const payload = {
      content: "Invoice content 100",
      invoiceNumber: "INV-100",
      amountSAR: 630000,
      issueDate: new Date().toISOString()
    };

    const res = await externalSalesVerificationService.processOfflineSalesVerification(sellerOrgId, payload);
    expect(res.success).toBe(true);
    expect(res.status).toBe("VERIFIED");
    expect(res.priceIntelligenceFeed.learnedMarketPriceSAR).toBe(4200);
  });

  test("2. Anti-Fraud Duplicate Check: should reject duplicate invoice hash", async () => {
    const payload = {
      content: "Invoice content 100",
      invoiceNumber: "INV-100",
      amountSAR: 630000,
      issueDate: new Date().toISOString()
    };

    const res = await externalSalesVerificationService.processOfflineSalesVerification(sellerOrgId, payload);
    expect(res.success).toBe(false);
    expect(res.status).toBe("REJECTED_DUPLICATE");
  });

  test("3. Merchant Commercial Portfolio: should calculate combined volume SAR 38M and Gold Seller badge", async () => {
    const cv = await CommercialPortfolioService.getMerchantCommercialPortfolio(sellerOrgId);
    expect(cv.commercialCv.totalVolumeSAR).toBe(38000000);
    expect(cv.badgeStatus.badge).toBe("GOLD_SELLER");
  });
});
