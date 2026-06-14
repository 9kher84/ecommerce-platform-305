require('dotenv').config();
const { sequelize } = require('../sequelize_setup');

async function checkSpecific() {
  // Check buyer1's ID in both users tables
  const [u1] = await sequelize.query(`SELECT id, email FROM "Users" WHERE email = 'buyer1@testdata.com'`);
  console.log("buyer1 in Users table (capital U):", u1);

  // The fix_user_roles_all.js found buyer1 with ID: c998d0e0...
  // but debug_rbac.js found ID: 9b495469...
  // This means there are TWO different buyer1 entries! Let's check all
  const [all] = await sequelize.query(`SELECT id, email, role FROM "Users" WHERE email LIKE 'buyer1%'`);
  console.log("All buyer1 variants:", all);

  // Check user_roles for the c998... ID (found by fix script)
  const [ur1] = await sequelize.query(`SELECT * FROM user_roles WHERE "userId" = 'c998d0e0-e3f0-4bef-b939-40c3c127b673'`);
  console.log("user_roles for c998 (fix script ID):", ur1);

  // Check user_roles for the 9b49... ID (found by debug script)
  const [ur2] = await sequelize.query(`SELECT * FROM user_roles WHERE "userId" = '9b495469-c8af-45a5-84d0-5cd4f630dc79'`);
  console.log("user_roles for 9b49 (debug script ID):", ur2);

  process.exit();
}
checkSpecific().catch(e => { console.error(e.message); process.exit(); });
