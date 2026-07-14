const { sequelize, Product, Organization, User, Category, ProductDNA, SellerListing } = require("./sequelize_setup");
const CatalogMigrationWorker = require("./jobs/CatalogMigrationWorker");

async function setupLegacyData() {
  const [cat] = await Category.findOrCreate({ where: { name_en: 'Steel Category' }, defaults: { name_ar: 'تصنيف' } });
  const [org1] = await Organization.findOrCreate({ where: { name: 'Mig Org 1' }, defaults: { commercial_registration: 'M-ORG-1' } });
  const [org2] = await Organization.findOrCreate({ where: { name: 'Mig Org 2' }, defaults: { commercial_registration: 'M-ORG-2' } });
  const [user1] = await User.findOrCreate({ where: { email: 'm1@test.com' }, defaults: { name: 'U1', password: 'pwd', role: 'seller' } });
  
  try {
    await sequelize.query(`ALTER TABLE seller_listings ADD COLUMN "legacyProductId" UUID;`);
    await sequelize.query(`ALTER TABLE seller_listings ADD COLUMN "migrationVersion" INTEGER DEFAULT 1;`);
  } catch(e) {} // Ignore if columns exist
  
  // Clean up old run (idempotency setup)
  await Product.destroy({ where: {} });
  await SellerListing.destroy({ where: {}, force: true });
  await ProductDNA.destroy({ where: {} });

  // Product A
  await Product.create({
    name: { en: "Steel Rebar", ar: "حديد" },
    unit: "Ton",
    ownerOrganizationId: org1.id,
    sellerId: user1.id,
    categoryId: cat.id,
    specs: JSON.stringify({ material: 'Steel', size: '12mm' }),
    estimatedPrice: 2000
  });

  // Product B (Identical to A, different Org) -> Should reuse DNA
  await Product.create({
    name: { en: "Steel Rebar", ar: "حديد" },
    unit: "Ton",
    ownerOrganizationId: org2.id,
    sellerId: user1.id,
    categoryId: cat.id,
    specs: JSON.stringify({ material: 'Steel', size: '12mm' }),
    estimatedPrice: 2100
  });

  // Product C (Different size) -> Should create new DNA
  await Product.create({
    name: { en: "Steel Rebar", ar: "حديد" },
    unit: "Ton",
    ownerOrganizationId: org1.id,
    sellerId: user1.id,
    categoryId: cat.id,
    specs: JSON.stringify({ material: 'Steel', size: '16mm' }),
    estimatedPrice: 2500
  });

  // Product D (Missing Org - Failure Simulation)
  await Product.create({
    name: { en: "Ghost Product", ar: "وهمي" },
    unit: "Piece",
    ownerOrganizationId: null, // Will cause failure
    sellerId: user1.id,
    categoryId: cat.id,
    estimatedPrice: 50
  });
}

async function runTests() {
  console.log("=== MIGRATION WORKER VERIFICATION ===\n");
  await setupLegacyData();

  console.log("[Phase 1] First Run (Dry Run)");
  const dryWorker = new CatalogMigrationWorker({ dryRun: true });
  const dryStats = await dryWorker.execute();
  console.log(`- Dry run total products migrated: ${dryStats.totalProductsMigrated}`);
  console.log(`- DB Listings Count after dry run: ${await SellerListing.count()} (Expected: 0)`);

  console.log("\n[Phase 2] First Run (Execution)");
  const execWorker = new CatalogMigrationWorker({ dryRun: false });
  const execStats = await execWorker.execute();
  console.log(`- Created DNA: ${execStats.totalDNACreated} (Expected: 2)`);
  console.log(`- Reused DNA: ${execStats.totalDNAReused} (Expected: 1)`);
  console.log(`- Failures: ${execStats.totalFailures} (Expected: 1)`);
  console.log(`- Duplicate Groups Count: ${execStats.duplicateGroups.length} (Expected: 2)`);

  console.log("\n[Phase 3] Second Run (Idempotency Check)");
  const rerunWorker = new CatalogMigrationWorker({ dryRun: false });
  const rerunStats = await rerunWorker.execute();
  console.log(`- Skipped Products: ${rerunStats.totalSkipped} (Expected: 3)`);
  console.log(`- DB DNA Count: ${await ProductDNA.count()} (Expected: 2)`);
  console.log(`- DB Listings Count: ${await SellerListing.count()} (Expected: 3)`);
  
  console.log("\n=== ALL TESTS COMPLETED ===");
  process.exit(0);
}

runTests().catch(console.error);
