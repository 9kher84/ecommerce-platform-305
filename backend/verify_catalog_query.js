const { sequelize, ProductDNA, Organization, User, SellerListing, Category, AttributeSchema, ProductDNAAttribute } = require("./sequelize_setup");
const CatalogQueryService = require("./services/CatalogQueryService");

async function setupData() {
  // 1. Categories
  const [cat] = await Category.findOrCreate({ where: { name_en: 'Query Test Cat' }, defaults: { name_ar: 'تصنيف الاختبار' } });

  // 2. Orgs & Users
  const [org] = await Organization.findOrCreate({ where: { name: 'Query Test Org' }, defaults: { commercial_registration: 'Q-ORG' } });
  const [user] = await User.findOrCreate({ where: { email: 'q.user@test.com' }, defaults: { name: 'Q User', password: 'pwd', role: 'seller' } });

  // 3. EAV Schema
  const [schemaWeight] = await AttributeSchema.findOrCreate({ where: { key: 'weight' }, defaults: { dataType: 'number', unit: 'kg' } });
  const [schemaMaterial] = await AttributeSchema.findOrCreate({ where: { key: 'material' }, defaults: { dataType: 'string' } });

  async function createListingSafe(dnaId, sku, price, status, orgId = org.id) {
    try {
      await SellerListing.create({
        dnaId: dnaId,
        sellerSku: sku,
        organizationId: orgId,
        createdByUserId: user.id,
        price: price,
        status: status
      });
    } catch (e) {
      if (e.name !== 'SequelizeUniqueConstraintError') throw e;
    }
  }

  // DNA 1: No active listings (only archived)
  const [dna1] = await ProductDNA.findOrCreate({ where: { normalizedName: 'Product Without Active Listings' }, defaults: { categoryId: cat.id } });
  await createListingSafe(dna1.id, 'DNA1-SKU', 100, 'archived');

  // DNA 2: Active, Paused, Archived (Price ordering test)
  const [dna2] = await ProductDNA.findOrCreate({ where: { normalizedName: 'Product With Mixed Listings' }, defaults: { categoryId: cat.id } });
  
  const [orgArchived] = await Organization.findOrCreate({ where: { name: 'Org Archived' }, defaults: { commercial_registration: 'Q-ORG-A' } });
  const [orgPaused] = await Organization.findOrCreate({ where: { name: 'Org Paused' }, defaults: { commercial_registration: 'Q-ORG-P' } });
  const [orgActive] = await Organization.findOrCreate({ where: { name: 'Org Active' }, defaults: { commercial_registration: 'Q-ORG-AC' } });
  
  await createListingSafe(dna2.id, 'DNA2-SKU-ARCHIVED', 10, 'archived', orgArchived.id);
  await createListingSafe(dna2.id, 'DNA2-SKU-PAUSED', 20, 'paused', orgPaused.id);
  await createListingSafe(dna2.id, 'DNA2-SKU-ACTIVE', 50, 'active', orgActive.id);

  // DNA 3: EAV Match Product (weight=1000, material=steel)
  const [dna3] = await ProductDNA.findOrCreate({ where: { normalizedName: 'Heavy Steel Product' }, defaults: { categoryId: cat.id } });
  await createListingSafe(dna3.id, 'DNA3-SKU-ACTIVE', 200, 'active');
  
  // Assign EAV
  await ProductDNAAttribute.findOrCreate({ where: { dnaId: dna3.id, attributeId: schemaWeight.id }, defaults: { valueNumber: 1000 } });
  await ProductDNAAttribute.findOrCreate({ where: { dnaId: dna3.id, attributeId: schemaMaterial.id }, defaults: { valueString: 'steel' } });

  // DNA 4: Partial EAV Match Product (weight=1000, material=iron)
  const [dna4] = await ProductDNA.findOrCreate({ where: { normalizedName: 'Heavy Iron Product' }, defaults: { categoryId: cat.id } });
  await createListingSafe(dna4.id, 'DNA4-SKU-ACTIVE', 150, 'active');
  
  // Assign EAV
  await ProductDNAAttribute.findOrCreate({ where: { dnaId: dna4.id, attributeId: schemaWeight.id }, defaults: { valueNumber: 1000 } });
  await ProductDNAAttribute.findOrCreate({ where: { dnaId: dna4.id, attributeId: schemaMaterial.id }, defaults: { valueString: 'iron' } });
}

async function runTests() {
  console.log("=== CATALOG QUERY VERIFICATION ===\n");
  await setupData();

  // Test 1: Product without active listings shouldn't appear
  console.log("[Test 1] Exclusion of products without active listings");
  const t1 = await CatalogQueryService.searchCatalog({ filters: {} });
  const hasDna1 = t1.data.some(d => d.product.normalizedName === 'Product Without Active Listings');
  console.log(`- Included DNA1? ${hasDna1} (Expected: false)`);

  // Test 2: Product with mixed listings should only show Active and sort by its price
  console.log("\n[Test 2] Product with mixed listings (Active, Paused, Archived)");
  const dna2Result = t1.data.find(d => d.product.normalizedName === 'Product With Mixed Listings');
  console.log(`- Best Active Listing Price: ${dna2Result.bestActiveListing.price} (Expected: 50.00)`);
  console.log(`- Is Archived listing ignored? ${dna2Result.bestActiveListing.price !== 10}`);

  // Test 3: Pagination and Sorting
  console.log("\n[Test 3] Pagination (limit: 1)");
  const t3 = await CatalogQueryService.searchCatalog({ pagination: { limit: 1, page: 1 }, sort: { field: 'price', direction: 'ASC' } });
  console.log(`- Returned length: ${t3.data.length} (Expected: 1)`);
  console.log(`- Meta totalItems: ${t3.metadata.totalItems}`);
  console.log(`- Meta hasNextPage: ${t3.metadata.hasNextPage}`);
  console.log(`- First item price: ${t3.data[0].bestActiveListing.price}`);

  // Test 4: Dynamic EAV Filtering (weight=1000 AND material=steel)
  console.log("\n[Test 4] EAV Intersection Filter (weight: 1000, material: steel)");
  const t4 = await CatalogQueryService.searchCatalog({
    filters: { eav: { weight: 1000, material: 'steel' } }
  });
  console.log(`- Returned count: ${t4.data.length} (Expected: 1)`);
  if (t4.data.length > 0) {
    console.log(`- Matched Product: ${t4.data[0].product.normalizedName} (Expected: Heavy Steel Product)`);
  }

  console.log("\n=== ALL TESTS COMPLETED ===");
  process.exit(0);
}

runTests().catch(console.error);
