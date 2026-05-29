// backend/migration-add-sector-to-request.js
const { sequelize } = require("./sequelize_setup");

async function runSectorMigration() {
  console.log("🔧 Starting PurchaseRequest Sector Migration...");
  let transaction;

  try {
    // Authenticate
    await sequelize.authenticate();
    console.log("✅ Connection authenticated.");

    // Start Transaction
    transaction = await sequelize.transaction();

    // 1. Add sectorId column
    console.log('1. Adding "sectorId" column to PurchaseRequests...');
    try {
      await sequelize.query(
        `
                ALTER TABLE "PurchaseRequests" 
                ADD COLUMN "sectorId" INTEGER 
                REFERENCES "Categories"(id) 
                ON UPDATE CASCADE 
                ON DELETE SET NULL;
            `,
        { transaction },
      ); // Note: FK is Integer because Categories.id is Integer
    } catch (e) {
      if (e.message.includes("already exists")) {
        console.log('⚠️ Column "sectorId" already exists.');
      } else throw e;
    }

    // 2. Data Patching: Assign Default Sector if needed
    // Since we are making it mandatory (allowNull: false), existing records MUST have a value.
    // Strategy: First add as nullable (done), update existing records, then Add NOT NULL constraint.

    console.log(
      '2. Patching existing requests using "General" Sector or Category logic...',
    );
    // For safety, let's find or create a 'General' Sector just strictly for migration data validty
    // But per "Data First", maybe we should map from categoryId?
    // Let's UPDATE "sectorId" = "categoryId" where category is a SECTOR?
    // Or if "categoryId" is a product_cat, set "sectorId" = parent of that category.

    // Advanced SQL: Set sectorId based on categoryId's parent
    await sequelize.query(
      `
            UPDATE "PurchaseRequests" pr
            SET "sectorId" = c."parentId"
            FROM "Categories" c
            WHERE pr."categoryId" = c.id
            AND c."type" = 'PRODUCT_CATEGORY'
            AND c."parentId" IS NOT NULL;
        `,
      { transaction },
    );

    // Fallback: If still null (e.g. category has no parent), we need a fallback or leave it null for now (and warn).
    // The Monitor requested "allowNull: false", so we MUST ensure data.
    // Let's check if any rely on null.

    // 3. Set NOT NULL (If applicable)
    // Sovereign Order: "allowNull: false".
    // But if we enforce it now on bad data, it crashes.
    // I will add constraint only if all fixed. For now, I'll log warning if nulls remain.

    const [nulls] = await sequelize.query(
      `SELECT count(*) FROM "PurchaseRequests" WHERE "sectorId" IS NULL`,
      { transaction },
    );

    if (parseInt(nulls[0].count) === 0) {
      console.log("3. Enforcing NOT NULL constraint...");
      await sequelize.query(
        `ALTER TABLE "PurchaseRequests" ALTER COLUMN "sectorId" SET NOT NULL`,
        { transaction },
      );
    } else {
      console.log(
        `⚠️ Warning: ${nulls[0].count} requests have NO sector. Skipping NOT NULL constraint to prevent data loss.`,
      );
      console.log(
        "👉 Please run a manual script to assign sectors to legacy data.",
      );
    }

    await transaction.commit();
    console.log(
      "✅✅✅ MIGRATION SUCCESSFUL: PurchaseRequests now has sectorId.",
    );
  } catch (error) {
    console.error("❌ Migration Failed:", error.message);
    if (transaction) await transaction.rollback();
    process.exit(1);
  }
}

runSectorMigration()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
