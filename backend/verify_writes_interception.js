const { sequelize, Product, ProductDNA, SellerListing } = require("./sequelize_setup");
const productController = require("./controllers/productController");
const CatalogWriteFacade = require("./services/CatalogWriteFacade");

const mockReq = (body = {}, params = {}, userId = "seller-123") => ({
  body,
  params,
  user: { id: userId }
});

const mockRes = () => {
  const res = {};
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (data) => { res.body = data; return res; };
  return res;
};

// Helper for delays
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
  console.log("=== WRITES INTERCEPTION VERIFICATION ===");
  process.env.USE_NEW_CATALOG_WRITES = 'true';

  let legacyProductId = null;
  const { Organization, User } = require("./sequelize_setup");
  const [org] = await Organization.findOrCreate({ 
    where: { id: "00000000-0000-0000-0000-000000000000" },
    defaults: { name: "Test Org Write" }
  });
  const [user] = await User.findOrCreate({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    defaults: {
      email: "testwrite@example.com",
      password: "password123",
      role: "seller"
    }
  });
  await user.update({ organizationId: org.id });
  const sellerId = user.id;
  
  // [Test 1] Add Product
  console.log("\n[Test 1] Add Product (Dual Write)");
  const addReq = mockReq({
    name: "Steel Rebar 12mm",
    description: "High quality steel",
    estimatedPrice: 1500,
    stockLevel: 50,
    categoryId: 1
  }, {}, sellerId);
  const addRes = mockRes();
  
  await productController.addProduct(addReq, addRes, () => {});
  
  if (addRes.body && addRes.body.success) {
    legacyProductId = addRes.body.product.id;
    console.log(`- Created successfully. returned ID: ${legacyProductId}`);
    
    // Verify in New Catalog
    const listing = await SellerListing.findOne({ where: { legacyProductId } });
    const dna = listing ? await ProductDNA.findByPk(listing.dnaId) : null;
    console.log(`- In New Catalog (SellerListing): ${!!listing}, Version: ${listing ? listing.catalogVersion : 'N/A'}`);
    console.log(`- In New Catalog (ProductDNA): ${!!dna}, Name: ${dna ? dna.normalizedName : 'N/A'}`);
    
    // Verify in Legacy
    const legacy = await Product.findByPk(legacyProductId);
    console.log(`- In Legacy Catalog: ${!!legacy}, Name: ${legacy ? legacy.name : 'N/A'}`);
  } else {
    console.log("- Add Product failed:", addRes.body);
  }

  // [Test 2] Update Product
  console.log("\n[Test 2] Update Product (Dual Write)");
  if (legacyProductId) {
    const updateReq = mockReq({
      estimatedPrice: 1600,
      stockLevel: 40
    }, { id: legacyProductId }, sellerId);
    const updateRes = mockRes();
    
    await productController.updateProduct(updateReq, updateRes, () => {});
    
    if (updateRes.body && updateRes.body.success) {
      console.log(`- Updated successfully.`);
      
      const listing = await SellerListing.findOne({ where: { legacyProductId } });
      console.log(`- In New Catalog (SellerListing): Version: ${listing.catalogVersion}, Price: ${listing.price}, Stock: ${listing.stockLevel}`);
      
      const legacy = await Product.findByPk(legacyProductId);
      console.log(`- In Legacy Catalog: Price: ${legacy.estimatedPrice}, Stock: ${legacy.stockLevel}`);
    } else {
      console.log("- Update Product failed:", updateRes.body);
    }
  }

  // [Test 3] Legacy Sync Failure & Retry
  console.log("\n[Test 3] Legacy Sync Failure & Retry");
  
  // Monkey patch syncToLegacy to fail once
  let syncAttempts = 0;
  const originalSyncToLegacy = CatalogWriteFacade._syncToLegacy;
  
  CatalogWriteFacade._syncToLegacy = async (...args) => {
    syncAttempts++;
    if (syncAttempts === 1) {
      console.log("  [Mock] Forcing syncToLegacy to fail...");
      throw new Error("Simulated Database Timeout on Legacy");
    }
    console.log("  [Mock] Allowing syncToLegacy to succeed...");
    return originalSyncToLegacy(...args);
  };
  
  const failReq = mockReq({
    name: "Cement 50kg",
    description: "Portland Cement",
    estimatedPrice: 15,
    stockLevel: 100,
    categoryId: 2
  }, {}, sellerId);
  const failRes = mockRes();
  
  await productController.addProduct(failReq, failRes, () => {});
  
  if (failRes.body && failRes.body.success) {
    const failedLegacyId = failRes.body.product.id;
    console.log(`- Add Product returned success (ID: ${failedLegacyId}) despite legacy failure.`);
    
    // Verify in New Catalog
    const listing = await SellerListing.findOne({ where: { legacyProductId: failedLegacyId } });
    console.log(`- In New Catalog (Source of Truth): ${!!listing}`);
    
    // Verify in Legacy
    const legacy = await Product.findByPk(failedLegacyId);
    console.log(`- In Legacy Catalog (Should be false): ${!!legacy}`);
    
    // Verify Retry Queue
    console.log(`- Items in Retry Queue: ${CatalogWriteFacade._legacySyncRetryQueue.length}`);
    
    // Wait for the background worker to pick it up (runs every 5 seconds)
    console.log("- Waiting 6 seconds for background retry worker...");
    await delay(6000);
    
    // Verify in Legacy again
    const legacyAfter = await Product.findByPk(failedLegacyId);
    console.log(`- In Legacy Catalog after retry (Should be true): ${!!legacyAfter}`);
    console.log(`- Items in Retry Queue after retry: ${CatalogWriteFacade._legacySyncRetryQueue.length}`);
  }
  
  // Restore original function
  CatalogWriteFacade._syncToLegacy = originalSyncToLegacy;

  // [Test 4] Delete Product (Soft Delete)
  console.log("\n[Test 4] Soft Delete Product");
  if (legacyProductId) {
    const delReq = mockReq({}, { id: legacyProductId }, sellerId);
    const delRes = mockRes();
    
    await productController.deleteProduct(delReq, delRes, () => {});
    
    if (delRes.body && delRes.body.success) {
      console.log(`- Soft Deleted successfully.`);
      
      const listing = await SellerListing.findOne({ where: { legacyProductId } });
      console.log(`- In New Catalog: Status = ${listing.status} (Expected: archived)`);
      
      const legacy = await Product.findByPk(legacyProductId);
      console.log(`- In Legacy Catalog: Status = ${legacy.status} (Expected: archived)`);
    } else {
      console.log("- Delete Product failed:", delRes.body);
    }
  }

  process.exit(0);
}

runTests().catch(console.error);
