// backend/direct-migration.js
const { sequelize } = require("./sequelize_setup");
// DO NOT require models directly if not needed, to avoid validation errors during load
// But sequelize_setup requires them.
// We rely on sequelize_setup working (as verified by npm start)

async function runDirectMigration() {
  console.log("🔧 Starting DIRECT database migration...");

  let transaction;

  try {
    // 0. Ensure Connection
    await sequelize.authenticate();
    console.log("✅ Connection Authenticated.");

    // 1. Start Manual Transaction
    transaction = await sequelize.transaction();

    console.log('1. Adding "type" column to Categories...');
    // Note: Enum creation in Postgres is tricky inside transactions sometimes, but we will try.
    // If ENUM type fails, we fallback to VARCHAR check constraint logic which is safer in raw SQL patches.
    // However, Sequelize typically creates the Type first.
    // Let's use the explicit SQL provided by Monitor which is cleaner.

    // Check if column exists first to avoid error? No, let's assume it fails if exists, or use IF NOT EXISTS logic if supported.
    // Postgres supports IF NOT EXISTS for ADD COLUMN in newer versions (9.6+).
    // Using standard SQL:
    try {
      await sequelize.query(
        `
          ALTER TABLE "Categories" 
          ADD COLUMN "type" VARCHAR(20) 
          DEFAULT 'PRODUCT_CATEGORY'
        `,
        { transaction },
      );

      // Add Check Constraint manually to simulate ENUM safely
      await sequelize.query(
        `
           ALTER TABLE "Categories" 
           ADD CONSTRAINT "check_type" CHECK ("type" IN ('SECTOR', 'PRODUCT_CATEGORY'))
        `,
        { transaction },
      );
    } catch (e) {
      if (e.message.includes("already exists")) {
        console.log('⚠️ Column "type" might already exist, skipping creation.');
      } else {
        throw e;
      }
    }

    console.log('2. Adding "parentId" column to Categories...');
    try {
      await sequelize.query(
        `
          ALTER TABLE "Categories" 
          ADD COLUMN "parentId" INTEGER 
          REFERENCES "Categories"(id) 
          ON UPDATE CASCADE 
          ON DELETE SET NULL
        `,
        { transaction },
      );
    } catch (e) {
      if (e.message.includes("already exists")) {
        console.log('⚠️ Column "parentId" might already exist, skipping.');
      } else throw e;
    }

    console.log('3. Creating "UserCategories" junction table...');
    try {
      await sequelize.query(
        `
          CREATE TABLE "UserCategories" (
            "userId" UUID REFERENCES "Users"(id) ON DELETE CASCADE ON UPDATE CASCADE,
            "categoryId" INTEGER REFERENCES "Categories"(id) ON DELETE CASCADE ON UPDATE CASCADE,
            "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            PRIMARY KEY ("userId", "categoryId")
          )
        `,
        { transaction },
      );
    } catch (e) {
      if (e.message.includes("already exists")) {
        console.log('⚠️ Table "UserCategories" might already exist, skipping.');
      } else throw e;
    }

    console.log("4. Updating existing categories to PRODUCT_CATEGORY...");
    await sequelize.query(
      `
      UPDATE "Categories" 
      SET "type" = 'PRODUCT_CATEGORY' 
      WHERE "type" IS NULL OR "type" = ''
    `,
      { transaction },
    );

    // Commit
    await transaction.commit();

    console.log("✅✅✅ DIRECT MIGRATION SUCCESSFUL!");
    console.log("✅ Added: type column (VARCHAR with CHECK constraint)");
    console.log("✅ Added: parentId column (self-reference)");
    console.log("✅ Created: UserCategories junction table");

    return true;
  } catch (error) {
    console.error("❌❌❌ DIRECT MIGRATION FAILED!");
    console.error("Error:", error.message);

    try {
      if (transaction && !transaction.finished) {
        await transaction.rollback();
        console.log("⚠️ Transaction rolled back due to error");
      }
    } catch (rollbackError) {
      console.error("Failed to rollback:", rollbackError.message);
    }

    throw error;
  }
}

// Execute
runDirectMigration()
  .then(() => {
    console.log("\n🎉 Migration completed successfully!");
    console.log("🔄 Please restart the server with: npm start");
    process.exit(0);
  })
  .catch((error) => {
    console.error(
      "\n💥 Migration failed. Manual intervention may be required.",
    );
    process.exit(1);
  });
