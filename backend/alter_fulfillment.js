const { sequelize, Shipment, ShipmentLine, Receipt, ReceiptLine } = require("./sequelize_setup");

async function runFulfillmentMigration() {
  console.log("=== STARTING FULFILLMENT MIGRATION (Blocker #19) ===");
  try {
    console.log("Syncing Shipment model...");
    await Shipment.sync({ alter: true });
    
    console.log("Syncing ShipmentLine model...");
    await ShipmentLine.sync({ alter: true });

    console.log("Syncing Receipt model...");
    await Receipt.sync({ alter: true });

    console.log("Syncing ReceiptLine model...");
    await ReceiptLine.sync({ alter: true });

    console.log("=== MIGRATION COMPLETED ===");
  } catch (error) {
    console.error("❌ MIGRATION FAILED:", error);
  } finally {
    process.exit(0);
  }
}

runFulfillmentMigration();
