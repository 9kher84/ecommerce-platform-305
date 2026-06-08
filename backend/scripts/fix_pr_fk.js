require('dotenv').config();
const { sequelize } = require('../sequelize_setup');

async function fixPRFK() {
  const t = await sequelize.transaction();
  try {
    console.log("Fixing PurchaseRequests FKs...");
    
    // Drop userId FK that points to Users (capital)
    await sequelize.query(`ALTER TABLE "PurchaseRequests" DROP CONSTRAINT "PurchaseRequests_userId_fkey"`, { transaction: t });
    
    // Clean up invalid records in PurchaseRequests using CASCADE TRUNCATE
    await sequelize.query(`TRUNCATE TABLE "PurchaseRequests" CASCADE`, { transaction: t });
    
    // Add userId FK pointing to users (lowercase)
    await sequelize.query(`
      ALTER TABLE "PurchaseRequests"
      ADD CONSTRAINT "PurchaseRequests_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
    `, { transaction: t });
    console.log("✅ Fixed userId FK in PurchaseRequests");

    await t.commit();
    process.exit(0);
  } catch (e) {
    try { await t.rollback(); } catch (_) {}
    console.error("Fatal:", e.message);
    process.exit(1);
  }
}
fixPRFK();
