require('dotenv').config();
const { sequelize } = require('../sequelize_setup');

async function fixUserRolesForAll() {
  // Check if user_roles has unique constraint on (userId, roleId)
  const [constraints] = await sequelize.query(`
    SELECT constraint_name FROM information_schema.table_constraints 
    WHERE table_name = 'user_roles';
  `);
  console.log("Constraints on user_roles:", constraints);

  // Check current count of user_roles
  const [count] = await sequelize.query(`SELECT COUNT(*) as cnt FROM user_roles`);
  console.log("Current user_roles count:", count[0].cnt);

  // Check Users count
  const [users] = await sequelize.query(`SELECT COUNT(*) as cnt FROM "Users"`);
  console.log("Total users:", users[0].cnt);

  // Attempt direct insert with different strategy: delete then re-insert
  console.log("Truncating user_roles and re-inserting from scratch...");
  await sequelize.query(`TRUNCATE TABLE user_roles RESTART IDENTITY CASCADE`);

  const result = await sequelize.query(`
    INSERT INTO user_roles ("userId", "roleId", "createdAt", "updatedAt")
    SELECT u.id, r.id, NOW(), NOW()
    FROM "Users" u
    JOIN roles r ON r.name = u.role::text;
  `);
  
  const [countAfter] = await sequelize.query(`SELECT COUNT(*) as cnt FROM user_roles`);
  console.log("user_roles count after insert:", countAfter[0].cnt);

  // Verify buyer1 specifically
  const [buyer1] = await sequelize.query(`
    SELECT ur."userId", r.name FROM user_roles ur
    JOIN roles r ON r.id = ur."roleId"
    JOIN "Users" u ON u.id = ur."userId"
    WHERE u.email = 'buyer1@testdata.com'
  `);
  console.log("buyer1@testdata.com roles:", buyer1);

  process.exit();
}

fixUserRolesForAll().catch(e => { console.error(e.message); process.exit(); });
