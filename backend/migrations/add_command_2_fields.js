/**
 * Database Migration for Command 2 & 6
 * Adds required fields to PurchaseRequest model
 *
 * Run this with: node backend/migrations/add_command_2_fields.js
 */

const { sequelize, PurchaseRequest } = require("../sequelize_setup");

async function runMigration() {
  try {
    console.log("🔄 Starting Command 2 & 6 migration...\n");

    // Add fields using ALTER TABLE
    await sequelize.query(`
            ALTER TABLE "PurchaseRequests" 
            ADD COLUMN IF NOT EXISTS "price_range_max" DECIMAL(10,2),
            ADD COLUMN IF NOT EXISTS "fixed_price" DECIMAL(10,2),
            ADD COLUMN IF NOT EXISTS "statusHistory" JSONB DEFAULT '[]';
        `);

    console.log("✅ Successfully added:");
    console.log("   - price_range_max (DECIMAL)");
    console.log("   - fixed_price (DECIMAL) - For Plan B buyers");
    console.log(
      "   - statusHistory (JSONB) - For status transition audit log\n",
    );

    // Verify columns exist
    const [results] = await sequelize.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'PurchaseRequests' 
            AND column_name IN ('price_range_max', 'fixed_price', 'statusHistory')
            ORDER BY column_name;
        `);

    console.log("📋 Migration verification:");
    results.forEach((row) => {
      console.log(`   ✓ ${row.column_name}: ${row.data_type}`);
    });

    console.log("\n✅ Migration completed successfully!");
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
