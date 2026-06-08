require('dotenv').config();
const { sequelize } = require('../sequelize_setup');

async function fixOrgIssue() {
  // 1. Check PurchaseRequests columns
  const [prCols] = await sequelize.query(`
    SELECT column_name, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'PurchaseRequests' 
    ORDER BY ordinal_position
  `);
  const colNames = prCols.map(c => c.column_name);
  console.log("PurchaseRequests columns:", colNames.join(', '));

  const hasOrgId = colNames.includes('organization_id');
  console.log("Has organization_id:", hasOrgId);

  if (!hasOrgId) {
    // Add it as nullable
    await sequelize.query(`ALTER TABLE "PurchaseRequests" ADD COLUMN IF NOT EXISTS organization_id UUID DEFAULT NULL`);
    console.log("✅ Added organization_id column (nullable)");
  }

  // 2. Check users table for organization_id
  const [uCols] = await sequelize.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'organization_id'
  `);
  const userHasOrgId = uCols.length > 0;
  console.log("users table has organization_id:", userHasOrgId);

  if (!userHasOrgId) {
    await sequelize.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id UUID DEFAULT NULL`);
    console.log("✅ Added organization_id to users table (nullable)");
  }

  process.exit(0);
}

fixOrgIssue().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
