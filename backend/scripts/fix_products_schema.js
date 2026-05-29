const { sequelize } = require("../sequelize_setup");

async function fixProductsSchema() {
  try {
    console.log("🛠 Starting Schema Correction for Products...");

    // Add storageCost column safely if it doesn't exist
    await sequelize.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                               WHERE table_name='Products' AND column_name='storageCost') THEN
                    ALTER TABLE "Products" ADD COLUMN "storageCost" DECIMAL(10, 2) DEFAULT 0.00;
                END IF;
            END $$;
        `);

    console.log("✅ Products Schema Correction Applied Successfully.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Products Schema Correction Failed:", error);
    process.exit(1);
  }
}

fixProductsSchema();
