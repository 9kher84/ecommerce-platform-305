const { sequelize, Award, AwardLine } = require("./sequelize_setup");

async function runAwardMigration() {
  console.log("=== STARTING AWARD MIGRATION (Blocker #17) ===");
  try {
    // We only need to sync the new models, we will force sync just for them
    console.log("Syncing Award model...");
    await Award.sync({ alter: true });
    
    console.log("Syncing AwardLine model...");
    await AwardLine.sync({ alter: true });

    // Ensure status enum on PurchaseRequestItem has 'partially_awarded' (User requested derived state for PR, but PRItem doesn't need it, PRItem is 'awarded'. 
    // Wait, PR status needs 'partially_awarded' and 'awarded'. PR is already in Sequelize.)
    // Let's add 'partially_awarded' and 'awarded' to PurchaseRequests.status enum manually just in case.
    
    try {
      await sequelize.query(`ALTER TYPE "enum_PurchaseRequests_status" ADD VALUE 'partially_awarded';`);
      console.log("Added 'partially_awarded' to PR status enum");
    } catch (err) {
      if (!err.message.includes("already exists")) console.error(err.message);
    }

    try {
      await sequelize.query(`ALTER TYPE "enum_PurchaseRequests_status" ADD VALUE 'awarded';`);
      console.log("Added 'awarded' to PR status enum");
    } catch (err) {
      if (!err.message.includes("already exists")) console.error(err.message);
    }
    
    try {
      await sequelize.query(`ALTER TYPE "enum_PurchaseRequestItems_status" ADD VALUE 'awarded';`);
      console.log("Added 'awarded' to PRItem status enum");
    } catch (err) {
      if (!err.message.includes("already exists")) console.error(err.message);
    }

    console.log("=== MIGRATION COMPLETED ===");
  } catch (error) {
    console.error("❌ MIGRATION FAILED:", error);
  } finally {
    process.exit(0);
  }
}

runAwardMigration();
