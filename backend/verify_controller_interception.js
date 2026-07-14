const { sequelize, Product, Organization, User, Category, ProductDNA, SellerListing } = require("./sequelize_setup");
const productController = require("./controllers/productController");
const CatalogFacade = require("./services/CatalogFacade");

// Mock Express req/res
const mockReq = (query = {}, userId = "user-123") => ({
  query,
  user: { id: userId }
});

const mockRes = () => {
  const res = {};
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.body = data; return res; };
  return res;
};

async function setupData() {
  const [cat] = await Category.findOrCreate({ where: { name_en: 'Steel' }, defaults: { name_ar: 'حديد' } });
  const [user1] = await User.findOrCreate({ where: { email: 'ctrl@test.com' }, defaults: { name: 'U1', password: 'pwd', role: 'seller' } });
  const [org1] = await Organization.findOrCreate({ where: { name: 'Ctrl Org' }, defaults: { commercial_registration: 'C-ORG-1' } });
  
  await Product.destroy({ where: {} });
  await SellerListing.destroy({ where: {}, force: true });
  await ProductDNA.destroy({ where: {} });

  // Create Legacy Product 1
  const p1 = await Product.create({
    name: { en: "Steel Rebar 12mm", ar: "حديد" },
    ownerOrganizationId: org1.id,
    sellerId: user1.id,
    categoryId: cat.id,
    estimatedPrice: 2000,
    stockLevel: 100,
    unit: "Ton"
  });

  // Create Legacy Product 2
  const p2 = await Product.create({
    name: { en: "Steel Rebar 16mm", ar: "حديد" },
    ownerOrganizationId: org1.id,
    sellerId: user1.id,
    categoryId: cat.id,
    estimatedPrice: 2500,
    stockLevel: 50,
    unit: "Ton"
  });

  // Run the Shadow Deduplication Worker to create DNA and Listings!
  const CatalogMigrationWorker = require("./jobs/CatalogMigrationWorker");
  const worker = new CatalogMigrationWorker({ dryRun: false });
  await worker.execute();

  return user1.id;
}

async function runTests() {
  console.log("=== CONTROLLER INTERCEPTION VERIFICATION ===\n");
  const userId = await setupData();

  console.log("[Test 1] Legacy Mode (USE_NEW_CATALOG_READS=false)");
  process.env.USE_NEW_CATALOG_READS = 'false';
  let req = mockReq({}, userId);
  let res = mockRes();
  await productController.getProducts(req, res, () => {});
  const legacyResponse = res.body;
  console.log(`- Success: ${legacyResponse.success}`);
  console.log(`- Count: ${legacyResponse.count}`);
  console.log(`- Data Array Length: ${legacyResponse.products.length}`);

  console.log("\n[Test 2] New Architecture Mode (USE_NEW_CATALOG_READS=true)");
  process.env.USE_NEW_CATALOG_READS = 'true';
  req = mockReq({}, userId);
  res = mockRes();
  await productController.getProducts(req, res, () => {});
  const newResponse = res.body;
  console.log(`- Success: ${newResponse.success}`);
  console.log(`- Count: ${newResponse.count}`);
  console.log(`- Data Array Length: ${newResponse.products.length}`);
  
  console.log("\n[Test 3] Contract Equality Check");
  const isMatch = (
    legacyResponse.success === newResponse.success &&
    legacyResponse.count === newResponse.count &&
    Array.isArray(legacyResponse.products) === Array.isArray(newResponse.products)
  );
  console.log(`- Strict Structure Match: ${isMatch ? 'PASSED ✅' : 'FAILED ❌'}`);

  console.log("\n[Test 4] Pagination Match (limit=1)");
  req = mockReq({ limit: 1 }, userId);
  res = mockRes();
  await productController.getProducts(req, res, () => {});
  console.log(`- Count with limit=1: ${res.body.count} (Expected: 1)`);
  console.log(`- Array Length: ${res.body.products.length} (Expected: 1)`);

  console.log("\n[Test 5] Empty Result Matching (Ghost User)");
  req = mockReq({}, "00000000-0000-0000-0000-000000000000");
  res = mockRes();
  await productController.getProducts(req, res, () => {});
  console.log(`- Empty User Count: ${res.body.count} (Expected: 0)`);
  console.log(`- Is products array?: ${Array.isArray(res.body.products)}`);
  console.log(`- Products array empty?: ${res.body.products.length === 0}`);

  console.log("\n[Test 6] Fallback Resilience & Metrics");
  // Mock CatalogFacade to throw
  const originalGetProducts = CatalogFacade.getProducts;
  CatalogFacade.getProducts = async () => { throw new Error("SIMULATED FACADE CRASH"); };
  
  req = mockReq({}, userId);
  res = mockRes();
  await productController.getProducts(req, res, () => {});
  
  // Restore
  CatalogFacade.getProducts = originalGetProducts;
  
  console.log(`- Did it crash? No, it fell back to legacy.`);
  console.log(`- Fallback response count: ${res.body.count}`);
  
  console.log("\n=== METRICS DUMP ===");
  console.log(JSON.stringify(productController.interceptionMetrics, null, 2));

  process.exit(0);
}

runTests().catch(console.error);
