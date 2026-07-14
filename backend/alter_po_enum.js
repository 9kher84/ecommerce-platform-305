const { sequelize } = require("./sequelize_setup");

async function run() {
  try {
    await sequelize.query(`ALTER TYPE "enum_PurchaseOrders_fulfillmentStatus" ADD VALUE 'ready_to_ship';`);
    console.log("Added ready_to_ship");
  } catch (err) {
    if (!err.message.includes("already exists")) console.error(err.message);
  }

  try {
    await sequelize.query(`ALTER TYPE "enum_PurchaseOrders_fulfillmentStatus" ADD VALUE 'partially_shipped';`);
    console.log("Added partially_shipped");
  } catch (err) {
    if (!err.message.includes("already exists")) console.error(err.message);
  }

  process.exit(0);
}

run();
