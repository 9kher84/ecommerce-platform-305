require('dotenv').config();
const { sequelize } = require('../sequelize_setup');

async function checkTables() {
  // Check both tables exist
  const [tables] = await sequelize.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name IN ('users', 'Users')
    ORDER BY table_name;
  `);
  console.log("Tables found:", tables);

  // Count in each
  try {
    const [c1] = await sequelize.query(`SELECT COUNT(*) as cnt FROM users`);
    console.log('users (lowercase) count:', c1[0].cnt);
  } catch(e) { console.log('users (lowercase): does not exist'); }

  try {
    const [c2] = await sequelize.query(`SELECT COUNT(*) as cnt FROM "Users"`);
    console.log('"Users" (capital) count:', c2[0].cnt);
  } catch(e) { console.log('"Users" (capital): does not exist'); }

  // buyer1 in lowercase users table?
  try {
    const [r] = await sequelize.query(`SELECT id, email, role FROM users WHERE email = 'buyer1@testdata.com'`);
    console.log("buyer1 in lowercase users:", r);
  } catch(e) { console.log("Error querying lowercase users:", e.message); }

  process.exit();
}
checkTables().catch(e => { console.error(e.message); process.exit(); });
