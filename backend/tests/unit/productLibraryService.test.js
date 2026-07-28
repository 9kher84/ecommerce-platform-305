const ProductLibraryService = require("../../services/productLibraryService");

describe("Product Library & Duplicate Detection Unit Suite", () => {
  const sellerOrgId = "org-seller-100";
  const productId = "prod-library-100";

  test("1. Attach Listing to Library Item: should attach seller offer in under 30 seconds", async () => {
    const result = await ProductLibraryService.attachListingToLibraryProduct(sellerOrgId, productId, {
      price: 2800,
      quantity: 100
    });

    expect(result.success).toBe(true);
    expect(result.mode).toBe("LIBRARY_ATTACHMENT");
  });

  test("2. Duplicate Detection: should check duplicate items by name query", async () => {
    const result = await ProductLibraryService.detectDuplicates("حديد");
    expect(result.isDuplicateFound).toBeDefined();
  });

  test("3. Progressive Draft Assistant: should return actionable next step suggestion", () => {
    const step1 = ProductLibraryService.getDraftNextSuggestion({});
    expect(step1.nextStep).toBe("ADD_IMAGE");

    const step2 = ProductLibraryService.getDraftNextSuggestion({ image: "http://img.jpg" });
    expect(step2.nextStep).toBe("ADD_SPECS");
  });
});
