const { initSequelize, AuditLog, sequelize } = require("./sequelize_setup");
const DataRetentionService = require("./services/dataRetentionService");

async function runRetentionTest() {
  console.log("=== L) Data Retention Tests ===\n");

  try {
    await initSequelize();

    // 1. Seed Logs
    console.log("--- 1. Seeding Data ---");

    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 100); // 100 days old

    const recentDate = new Date(); // Now

    // Force creation with specific date
    // Note: Sequelize might overwrite createdAt unless we are careful.
    // We might need to update it separately or use bulkCreate?
    // Let's try direct create first.
    const oldLog = await AuditLog.create({
      action: "TEST_RETENTION_OLD",
      userId: null,
      details: { test: true },
      createdAt: oldDate,
    });

    // Hack: Update the date manually via query if Sequelize overwrote it
    // Or check if it worked.
    // Re-fetch to check date
    const checkOld = await AuditLog.findByPk(oldLog.id);
    const diffDays =
      (new Date() - new Date(checkOld.createdAt)) / (1000 * 60 * 60 * 24);

    if (diffDays < 90) {
      console.log(
        "⚠️ Warning: Sequelize overwrote createdAt. Using direct SQL update to force old date.",
      );
      await sequelize.query(
        `UPDATE audit_logs SET "createdAt" = :date WHERE id = :id`,
        {
          replacements: { date: oldDate, id: oldLog.id },
          type: sequelize.QueryTypes.UPDATE,
        },
      );
    } else {
      console.log("✅ Created old log successfully via standard create.");
    }

    const newLog = await AuditLog.create({
      action: "TEST_RETENTION_NEW",
      userId: null,
      details: { test: true },
      createdAt: recentDate,
    });

    console.log(`✅ Seeded: Old Log ID ${oldLog.id}, New Log ID ${newLog.id}`);

    // 2. Run Cleanup
    console.log("\n--- 2. Executing Cleanup ---");
    const deletedCount = await DataRetentionService.cleanOldAuditLogs();

    // 3. Verify
    console.log("\n--- 3. Verification ---");

    const oldExists = await AuditLog.findByPk(oldLog.id);
    const newExists = await AuditLog.findByPk(newLog.id);

    if (!oldExists) {
      console.log("✅ PASS: Old log was deleted.");
    } else {
      console.log("❌ FAIL: Old log still exists!");
    }

    if (newExists) {
      console.log("✅ PASS: Recent log was preserved.");
    } else {
      console.log("❌ FAIL: Recent log was deleted!");
    }

    if (deletedCount >= 1) {
      console.log(
        `✅ Cleanup function report: Deleted ${deletedCount} records.`,
      );
    }
  } catch (error) {
    console.error("CRITICAL ERROR:", error);
  } finally {
    /* 
         Since we are running in a standalone script, we might need to close connections 
         or just let the process exit (if handles are not keeping it open).
         Sequelize connection usually keeps event loop open.
        */
    // await sequelize.close(); // Optional but clean
    process.exit(0);
  }
}

runRetentionTest();
