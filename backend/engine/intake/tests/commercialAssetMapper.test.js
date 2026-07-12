const CommercialAssetMapper = require("../mappers/CommercialAssetMapper");
const CommercialOpportunityDTO = require("../domain/CommercialOpportunityDTO");

describe("Phase 2.5: CommercialAssetMapper Unit Tests", () => {
  const context = {
    userId: "user-123",
    organizationId: "org-456",
    categoryId: 10
  };

  it("should map a SUPPLY DTO to a Product Payload", () => {
    const dto = new CommercialOpportunityDTO({
      type: "SUPPLY",
      name: "Laptop",
      quantity: 50,
      unit: "piece",
      price: 3000
    });

    const result = CommercialAssetMapper.mapToPayload(dto, {}, context);

    expect(result.entityType).toBe("Product");
    expect(result.payload).toEqual({
      name: { ar: "Laptop", en: "Laptop" },
      description: { ar: "", en: "" },
      quantity: 50,
      stockLevel: 50,
      unit: "piece",
      estimatedPrice: 3000,
      assetTypeId: null,
      sellerId: "user-123",
      ownerOrganizationId: "org-456",
      categoryId: 10,
      productTier: "basic"
    });
  });

  it("should map a DEMAND DTO to a PurchaseRequest Payload", () => {
    const dto = new CommercialOpportunityDTO({
      type: "DEMAND",
      name: "Office Chairs",
      quantity: 200,
      unit: "piece",
      price: null // No price provided by user
    });

    const validationMetadata = {
      suggestedPrice: 150 // Passed from PricingValidator
    };

    const result = CommercialAssetMapper.mapToPayload(dto, validationMetadata, context);

    expect(result.entityType).toBe("PurchaseRequest");
    expect(result.payload).toEqual({
      title: "Office Chairs",
      description: "",
      quantity: 200,
      unit: "piece",
      price_range_max: 150, // Falls back to suggested price
      assetTypeId: null,
      userId: "user-123",
      organization_id: "org-456",
      sectorId: 10,
      status: "draft"
    });
  });

  it("should throw an error if DTO type is unsupported", () => {
    const dto = new CommercialOpportunityDTO({
      type: "INVALID_TYPE",
      name: "Unknown"
    });

    expect(() => {
      CommercialAssetMapper.mapToPayload(dto, {}, context);
    }).toThrow("Unsupported opportunity type: INVALID_TYPE");
  });
});
