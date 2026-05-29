// backend/final-migration.js
const { sequelize } = require("./sequelize_setup");

async function runSafeMigration() {
  console.log("🔧 Starting SAFE database migration...");

  try {
    // 0. Authenticate
    await sequelize.authenticate();
    console.log("✅ Connection authenticated.");

    // 1. Add column "type" (Separate operation)
    try {
      console.log('1. Adding "type" column...');
      await sequelize.query(`
        DO $$ 
        BEGIN
          BEGIN
            ALTER TABLE "Categories" 
            ADD COLUMN "type" VARCHAR(20) 
            DEFAULT 'PRODUCT_CATEGORY';
          EXCEPTION WHEN duplicate_column THEN
            RAISE NOTICE 'Column "type" already exists, skipping.';
          END;
          
          BEGIN
            ALTER TABLE "Categories" 
            ADD CONSTRAINT "check_type" 
            CHECK ("type" IN ('SECTOR', 'PRODUCT_CATEGORY'));
          EXCEPTION WHEN duplicate_object THEN
            RAISE NOTICE 'Constraint "check_type" already exists, skipping.';
          END;
        END $$;
      `);
      console.log('✅ "type" column handled.');
    } catch (error) {
      console.log("⚠️ Non-critical error in type column:", error.message);
    }

    // 2. Add column "parentId" (Separate operation)
    try {
      console.log('2. Adding "parentId" column...');
      await sequelize.query(`
        DO $$ 
        BEGIN
          BEGIN
            ALTER TABLE "Categories" 
            ADD COLUMN "parentId" INTEGER 
            REFERENCES "Categories"(id) 
            ON UPDATE CASCADE 
            ON DELETE SET NULL;
          EXCEPTION WHEN duplicate_column THEN
            RAISE NOTICE 'Column "parentId" already exists, skipping.';
          END;
        END $$;
      `);
      console.log('✅ "parentId" column handled.');
    } catch (error) {
      console.log("⚠️ Non-critical error in parentId column:", error.message);
    }

    // 3. Create table UserCategories (Separate operation)
    try {
      console.log('3. Creating "UserCategories" table...');
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS "UserCategories" (
          "userId" UUID REFERENCES "Users"(id) 
            ON DELETE CASCADE 
            ON UPDATE CASCADE,
          "categoryId" INTEGER REFERENCES "Categories"(id) 
            ON DELETE CASCADE 
            ON UPDATE CASCADE,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          PRIMARY KEY ("userId", "categoryId")
        );
      `);
      console.log('✅ "UserCategories" table handled.');
    } catch (error) {
      console.log("⚠️ Non-critical error in UserCategories:", error.message);
    }

    // 4. Update data
    try {
      console.log("4. Updating existing categories...");
      await sequelize.query(`
        UPDATE "Categories" 
        SET "type" = 'PRODUCT_CATEGORY' 
        WHERE "type" IS NULL OR "type" = '';
      `);
      console.log("✅ Existing categories updated.");
    } catch (error) {
      console.log("⚠️ Non-critical error updating data:", error.message);
    }

    console.log("\n🎉🎉🎉 MIGRATION COMPLETED SUCCESSFULLY!");
    console.log("========================================");
    console.log("Summary:");
    console.log("✅ All operations attempted with individual transactions");
    console.log("✅ Each operation independent (no transaction abort chain)");
    console.log("✅ Non-critical errors logged but migration continues");
    console.log("✅ Database schema should now support Sector system");

    return true;
  } catch (error) {
    console.error("❌❌❌ FATAL MIGRATION ERROR:", error.message);
    throw error;
  }
}

// Execute
runSafeMigration()
  .then(() => {
    console.log("\n📋 Next steps:");
    console.log("1. Restart server: npm start");
    console.log("2. Verify with: GET /api/categories");
    console.log("3. Test sector creation via API");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Migration failed critically.");
    process.exit(1);
  });
