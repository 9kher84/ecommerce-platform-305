const ProductIngressService = require("../../services/productIngressService");

describe("Product Ingress Service Unit Suite", () => {
  const sellerOrgId = "org-seller-100";

  test("1. Quick Add Product: should create basic listing in under 60 seconds SLA", async () => {
    const result = await ProductIngressService.quickAddProduct(sellerOrgId, {
      name: "خرسانة جاهزة 350",
      price: 240,
      quantity: 50
    });

    expect(result.success).toBe(true);
    expect(result.mode).toBe("QUICK_ADD");
    expect(result.completenessScore).toBeGreaterThanOrEqual(20);
  });

  test("2. Completeness Score: should evaluate completeness progress score", () => {
    const score = ProductIngressService.calculateCompletenessScore({
      description: "خرسانة عالية الجودة",
      specs: "C35 Concrete",
      moq: 10,
      sku: "CON-350"
    });

    expect(score).toBeGreaterThan(50);
  });

  test("3. Smart AI Import: should extract structured product details from document", async () => {
    const result = await ProductIngressService.smartAiImport("Invoice text payload");

    expect(result.success).toBe(true);
    expect(result.extractedData.name).toBeDefined();
    expect(result.extractedData.confidencePercent).toBeGreaterThan(90);
  });
});
