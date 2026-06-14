require('dotenv').config();
const { sequelize } = require('../sequelize_setup');

async function checkPRFK() {
  const [fks] = await sequelize.query(`
    SELECT
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name,
      tc.constraint_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'PurchaseRequests';
  `);
  console.log("PurchaseRequests FKs:", fks);

  const [cols] = await sequelize.query(`
    SELECT column_name, data_type FROM information_schema.columns 
    WHERE table_name = 'PurchaseRequests'
  `);
  console.log("PurchaseRequests columns:", cols);

  process.exit(0);
}
checkPRFK().catch(e => { console.error(e.message); process.exit(1); });
