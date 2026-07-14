const LegacyProductAdapter = require('./adapters/LegacyProductAdapter');

function createMockCatalogDto() {
  return {
    product: {
      id: "dna-1234",
      normalizedName: "Generic Product",
      description: "High quality generic product",
      categoryId: 1,
      brandId: "brand-1234",
      ecoRating: "A++", // NEW FIELD: Should be ignored by adapter
      complianceStatus: "approved"
    },
    bestActiveListing: {
      id: "listing-1234",
      price: 150.00,
      currencyCode: "SAR",
      stockLevel: 42,
      deliveryTime: 3,
      sellerSku: "SKU-999",
      status: "active",
      organization: {
        id: "org-1234",
        name: "Test Org"
      },
      createdByUserId: "user-1234",
      autoNegotiationEnabled: true,
      minAcceptablePrice: 120.00
    },
    attributes: [
      { key: "weight", value: 1000, dataType: "number", unit: "kg" },
      { key: "material", value: "Steel", dataType: "string" },
      { key: "fireResistance", value: true, dataType: "boolean" } // NEW EAV FIELD
    ]
  };
}

function runTests() {
  console.log("=== LEGACY ADAPTER VERIFICATION ===");
  
  const catalogDto = createMockCatalogDto();
  const legacyProduct = LegacyProductAdapter.toLegacyProduct(catalogDto);

  // Test 1: Keys Match Contract
  console.log("\n[Test 1] Keys Match Legacy Contract");
  const expectedKeys = [
    'id', 'name', 'description', 'categoryId', 'assetTypeId',
    'ownerOrganizationId', 'sellerId', 'estimatedPrice', 'purchasePrice',
    'currencyCode', 'autoNegotiationEnabled', 'minAcceptablePrice',
    'negotiationStrategy', 'stockLevel', 'lowStockThreshold',
    'deliveryTime', 'storageCost', 'status', 'specs', 'unit', 'origin',
    'productTier', 'image', 'productionDate', 'ai_proposals'
  ];
  
  const legacyKeys = Object.keys(legacyProduct);
  const missingKeys = expectedKeys.filter(k => !legacyKeys.includes(k));
  console.log(`- Missing keys: ${missingKeys.length === 0 ? 'None' : missingKeys.join(', ')}`);
  
  // Test 2: Types match
  console.log("\n[Test 2] Data Types Preservation");
  console.log(`- name is object (JSON)? ${typeof legacyProduct.name === 'object'}`);
  console.log(`- estimatedPrice is number? ${typeof legacyProduct.estimatedPrice === 'number'}`);
  console.log(`- stockLevel is number? ${typeof legacyProduct.stockLevel === 'number'}`);
  
  // Test 5 (from user instructions): New DNA Property Exclusion
  console.log("\n[Test 5] New Property Exclusion (ecoRating)");
  console.log(`- ecoRating leaked into legacy product? ${legacyProduct.ecoRating !== undefined}`);
  console.log(`- (Expected: false)`);

  // Test 6 (from user instructions): Dynamic EAV Inclusion
  console.log("\n[Test 6] Dynamic EAV Inclusion (fireResistance)");
  console.log(`- fireResistance exists in specs? ${legacyProduct.specs.fireResistance !== undefined}`);
  console.log(`- Value is generic? ${legacyProduct.specs.fireResistance === true}`);
  console.log(`- (Expected: true, true)`);

  // Output final shape for visual check
  console.log("\n=== RESULTING LEGACY DTO SHAPE ===");
  console.log(JSON.stringify(legacyProduct, null, 2));
}

runTests();
