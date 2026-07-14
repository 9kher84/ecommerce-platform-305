const { sequelize, SmartInventory } = require("./sequelize_setup");

async function runInventoryMigration() {
  console.log("=== STARTING INVENTORY MIGRATION (Blocker #21) ===");
  try {
    console.log("Syncing SmartInventory model...");
    await SmartInventory.sync({ alter: true });

    console.log("=== MIGRATION COMPLETED ===");
  } catch (error) {
    console.error("❌ MIGRATION FAILED:", error);
  } finally {
    process.exit(0);
  }
}

runInventoryMigration();
