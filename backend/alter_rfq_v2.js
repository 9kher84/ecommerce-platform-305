const { sequelize } = require('./sequelize_setup'); 

async function migrate() {
  try {
    await sequelize.query('ALTER TABLE "PurchaseRequests" ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;');
    await sequelize.query('ALTER TYPE "enum_PurchaseRequests_status" ADD VALUE IF NOT EXISTS \'partially_awarded\';');
    console.log('Done');
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

migrate();
