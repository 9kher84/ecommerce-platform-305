const { sequelize, Product, Organization, User, Category, ProductDNA, SellerListing } = require("./sequelize_setup");
const productController = require("./controllers/productController");
const systemController = require("./controllers/systemController");
const crypto = require("crypto");

const mockReq = (headers = {}, userId = "user-123") => ({
  headers,
  query: {},
  user: { id: userId }
});

const mockRes = () => {
  const res = {};
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.body = data; return res; };
  return res;
};

// Reset metrics before tests
function resetMetrics() {
  productController.interceptionMetrics.legacy_requests = 0;
  productController.interceptionMetrics.legacy_total_latency_ms = 0;
  productController.interceptionMetrics.new_catalog_requests = 0;
  productController.interceptionMetrics.new_total_latency_ms = 0;
  productController.interceptionMetrics.fallback_requests = 0;
  productController.interceptionMetrics.fallback_total_latency_ms = 0;
  productController.interceptionMetrics.fallback_reasons = {
    timeout: 0, database: 0, adapter: 0, validation: 0, unknown: 0
  };
}

async function runTests() {
  console.log("=== CANARY ROLLOUT VERIFICATION ===");
  process.env.USE_NEW_CATALOG_READS = 'true';

  // [Test 1] 0% Canary
  resetMetrics();
  process.env.CANARY_READ_PERCENTAGE = '0';
  for (let i = 0; i < 10; i++) {
    await productController.getProducts(mockReq({}, `user-${i}`), mockRes(), () => {});
  }
  console.log(`\n[Test 1] 0% Canary -> New: ${productController.interceptionMetrics.new_catalog_requests}, Legacy: ${productController.interceptionMetrics.legacy_requests} (Expected: 0 New, 10 Legacy)`);

  // [Test 2] 100% Canary
  resetMetrics();
  process.env.CANARY_READ_PERCENTAGE = '100';
  for (let i = 0; i < 10; i++) {
    await productController.getProducts(mockReq({}, `user-${i}`), mockRes(), () => {});
  }
  console.log(`\n[Test 2] 100% Canary -> New: ${productController.interceptionMetrics.new_catalog_requests}, Legacy: ${productController.interceptionMetrics.legacy_requests} (Expected: 10 New, 0 Legacy)`);

  // [Test 3] Header Override
  resetMetrics();
  process.env.CANARY_READ_PERCENTAGE = '0'; // Set to 0 but use header
  await productController.getProducts(mockReq({ 'x-canary-catalog': 'true' }, "user-x"), mockRes(), () => {});
  console.log(`\n[Test 3] Header Force Canary (0% set) -> New: ${productController.interceptionMetrics.new_catalog_requests} (Expected: 1)`);

  process.env.CANARY_READ_PERCENTAGE = '100'; // Set to 100 but use header false
  await productController.getProducts(mockReq({ 'x-canary-catalog': 'false' }, "user-y"), mockRes(), () => {});
  console.log(`[Test 3] Header Force Legacy (100% set) -> Legacy: ${productController.interceptionMetrics.legacy_requests} (Expected: 1)`);

  // [Test 4] Stable 30% Canary
  resetMetrics();
  process.env.CANARY_READ_PERCENTAGE = '30';
  for (let i = 0; i < 100; i++) {
    const randomUser = crypto.randomUUID();
    await productController.getProducts(mockReq({}, randomUser), mockRes(), () => {});
  }
  console.log(`\n[Test 4] 30% Canary over 100 random users -> New: ${productController.interceptionMetrics.new_catalog_requests}, Legacy: ${productController.interceptionMetrics.legacy_requests}`);
  console.log(`- Is stable? (Same user = same path)`);
  
  // Test stability
  const stableUser = crypto.randomUUID();
  const startNew = productController.interceptionMetrics.new_catalog_requests;
  const startLegacy = productController.interceptionMetrics.legacy_requests;
  for (let i = 0; i < 5; i++) {
    await productController.getProducts(mockReq({}, stableUser), mockRes(), () => {});
  }
  const endNew = productController.interceptionMetrics.new_catalog_requests;
  const endLegacy = productController.interceptionMetrics.legacy_requests;
  console.log(`- Stable user hits: New: ${endNew - startNew}, Legacy: ${endLegacy - startLegacy} (One should be 5, the other 0)`);

  // [Test 5] Fallback Categorization & Latency
  resetMetrics();
  process.env.CANARY_READ_PERCENTAGE = '100';
  
  const CatalogFacade = require("./services/CatalogFacade");
  const originalGetProducts = CatalogFacade.getProducts;
  
  // Mock timeout
  CatalogFacade.getProducts = async () => { 
    return new Promise((_, rej) => setTimeout(() => rej(new Error("Connection timeout")), 50));
  };
  await productController.getProducts(mockReq({}, "user-1"), mockRes(), () => {});

  // Mock adapter
  CatalogFacade.getProducts = async () => { throw new Error("Adapter mapping failed"); };
  await productController.getProducts(mockReq({}, "user-2"), mockRes(), () => {});
  
  CatalogFacade.getProducts = originalGetProducts; // restore
  
  const metricsRes = mockRes();
  await systemController.getCatalogMetrics({}, metricsRes);
  
  console.log(`\n[Test 5] Metrics Endpoint Output:`);
  console.log(JSON.stringify(metricsRes.body, null, 2));

  process.exit(0);
}

runTests().catch(console.error);
