/**
 * Command 7: Smart Pricing Matrix Migration
 * Creates SellerPricingMatrix table for Plan B sellers
 */

const { sequelize } = require("../sequelize_setup");

async function runMigration() {
  try {
    console.log("🔄 Starting Command 7 migration: SellerPricingMatrix...\n");

    // Create table
    await sequelize.query(`
            CREATE TABLE IF NOT EXISTS "SellerPricingMatrices" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "sellerId" UUID NOT NULL REFERENCES "Users"("id") ON DELETE CASCADE,
                "categoryId" INTEGER REFERENCES "Categories"("id") ON DELETE SET NULL,
                "name" VARCHAR(255) NOT NULL,
                "isActive" BOOLEAN DEFAULT true,
                "rules" JSONB DEFAULT '[]',
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
            );
        `);

    // Create indexes
    await sequelize.query(`
            CREATE INDEX IF NOT EXISTS "seller_pricing_seller_idx" 
            ON "SellerPricingMatrices"("sellerId", "isActive");
        `);

    await sequelize.query(`
            CREATE INDEX IF NOT EXISTS "seller_pricing_category_idx" 
            ON "SellerPricingMatrices"("sellerId", "categoryId");
        `);

    console.log("✅ Successfully created:");
    console.log("   - SellerPricingMatrices table");
    console.log("   - Seller + Active index");
    console.log("   - Seller + Category index\n");

    // Verify table exists
    const [results] = await sequelize.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'SellerPricingMatrices'
            ORDER BY ordinal_position;
        `);

    console.log("📋 Table structure:");
    results.forEach((row) => {
      console.log(`   ✓ ${row.column_name}: ${row.data_type}`);
    });

    console.log("\n✅ Command 7 migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  runMigration();
}

module.exports = runMigration;
