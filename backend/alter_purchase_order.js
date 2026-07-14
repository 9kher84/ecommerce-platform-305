const { sequelize, PurchaseOrder, PurchaseOrderLine } = require("./sequelize_setup");

async function runPOMigration() {
  console.log("=== STARTING PO MIGRATION (Blocker #18) ===");
  try {
    console.log("Syncing PurchaseOrder model...");
    await PurchaseOrder.sync({ alter: true });
    
    console.log("Syncing PurchaseOrderLine model...");
    await PurchaseOrderLine.sync({ alter: true });

    console.log("=== MIGRATION COMPLETED ===");
  } catch (error) {
    console.error("❌ MIGRATION FAILED:", error);
  } finally {
    process.exit(0);
  }
}

runPOMigration();
