const { sequelize } = require("./sequelize_setup");

async function runQuotationMigration() {
  console.log("=== STARTING QUOTATION MIGRATION (Blocker #16) ===");
  try {
    // 1. ALTER ENUM for Quotation Status
    console.log("Updating ENUM for Quotation status...");
    try {
      await sequelize.query(`ALTER TYPE "enum_Quotations_status" ADD VALUE 'withdrawn';`);
      console.log("Added 'withdrawn' to enum");
    } catch (err) {
      if (err.message.includes("already exists")) console.log("'withdrawn' already exists");
      else throw err;
    }
    
    try {
      await sequelize.query(`ALTER TYPE "enum_Quotations_status" ADD VALUE 'superseded';`);
      console.log("Added 'superseded' to enum");
    } catch (err) {
      if (err.message.includes("already exists")) console.log("'superseded' already exists");
      else throw err;
    }

    // 2. ALTER TABLE Quotations to add new pricing breakdown and granular timestamps
    console.log("Altering Quotations table...");
    const quotationQueries = [
      `ALTER TABLE "Quotations" ADD COLUMN IF NOT EXISTS "subtotal" DECIMAL(15,2) NOT NULL DEFAULT 0.0;`,
      `ALTER TABLE "Quotations" ADD COLUMN IF NOT EXISTS "taxAmount" DECIMAL(15,2) NOT NULL DEFAULT 0.0;`,
      `ALTER TABLE "Quotations" ADD COLUMN IF NOT EXISTS "discountAmount" DECIMAL(15,2) NOT NULL DEFAULT 0.0;`,
      `ALTER TABLE "Quotations" ADD COLUMN IF NOT EXISTS "grandTotal" DECIMAL(15,2) NOT NULL DEFAULT 0.0;`,
      `ALTER TABLE "Quotations" ADD COLUMN IF NOT EXISTS "submittedAt" TIMESTAMP WITH TIME ZONE;`,
      `ALTER TABLE "Quotations" ADD COLUMN IF NOT EXISTS "expiresAt" TIMESTAMP WITH TIME ZONE;`,
      `ALTER TABLE "Quotations" ADD COLUMN IF NOT EXISTS "withdrawnAt" TIMESTAMP WITH TIME ZONE;`,
      `ALTER TABLE "Quotations" ADD COLUMN IF NOT EXISTS "acceptedAt" TIMESTAMP WITH TIME ZONE;`,
      `ALTER TABLE "Quotations" ADD COLUMN IF NOT EXISTS "rejectedAt" TIMESTAMP WITH TIME ZONE;`,
    ];

    for (const q of quotationQueries) {
      await sequelize.query(q);
    }
    console.log("Quotations table updated successfully.");

    // 3. Migrate totalAmount to grandTotal if needed
    await sequelize.query(`UPDATE "Quotations" SET "grandTotal" = "totalAmount" WHERE "totalAmount" IS NOT NULL;`);
    console.log("Migrated totalAmount to grandTotal.");

    // 4. ALTER TABLE QuotationItems to add snapshot fields
    console.log("Altering QuotationItems table...");
    const quotationItemQueries = [
      `ALTER TABLE "QuotationItems" ADD COLUMN IF NOT EXISTS "requestedDescription" TEXT;`,
      `ALTER TABLE "QuotationItems" ADD COLUMN IF NOT EXISTS "requestedQuantity" DECIMAL(10,2);`,
      `ALTER TABLE "QuotationItems" ADD COLUMN IF NOT EXISTS "requestedUnit" VARCHAR(255);`,
    ];

    for (const q of quotationItemQueries) {
      await sequelize.query(q);
    }
    console.log("QuotationItems table updated successfully.");

    // Run sequelize.sync to make sure models are fully aligned
    await sequelize.sync({ alter: true });
    console.log("Sequelize sync completed.");

    console.log("=== MIGRATION COMPLETED ===");
  } catch (error) {
    console.error("❌ MIGRATION FAILED:", error);
  } finally {
    process.exit(0);
  }
}

runQuotationMigration();
