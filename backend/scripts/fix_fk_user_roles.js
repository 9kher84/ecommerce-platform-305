require('dotenv').config();
const { sequelize } = require('../sequelize_setup');

async function fixFK() {
  console.log("Fixing user_roles FK to point to 'users' (lowercase) instead of 'Users' (capital)...");

  // Start transaction
  const t = await sequelize.transaction();
  try {
    // Drop old FK constraint
    await sequelize.query(`
      ALTER TABLE user_roles DROP CONSTRAINT "user_roles_userId_fkey"
    `, { transaction: t });
    console.log("✅ Dropped old FK constraint");

    // Truncate user_roles (it currently points to wrong Users table)
    await sequelize.query(`TRUNCATE TABLE user_roles`, { transaction: t });
    console.log("✅ Cleared user_roles");

    // Add new FK constraint pointing to lowercase users table
    await sequelize.query(`
      ALTER TABLE user_roles 
      ADD CONSTRAINT "user_roles_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
    `, { transaction: t });
    console.log("✅ Added new FK pointing to 'users' (lowercase)");

    // Re-populate user_roles from the correct users table
    await sequelize.query(`
      INSERT INTO user_roles ("userId", "roleId", "createdAt", "updatedAt")
      SELECT u.id, r.id, NOW(), NOW()
      FROM users u
      JOIN roles r ON r.name = u.role::text
      ON CONFLICT DO NOTHING
    `, { transaction: t });
    console.log("✅ Re-populated user_roles from 'users' table");

    await t.commit();

    // Verify buyer1
    const [buyer1] = await sequelize.query(`
      SELECT u.email, r.name as role_name
      FROM users u
      JOIN user_roles ur ON ur."userId" = u.id
      JOIN roles r ON r.id = ur."roleId"
      WHERE u.email = 'buyer1@testdata.com'
    `);
    console.log("Verification - buyer1@testdata.com:", buyer1);

    const [count] = await sequelize.query(`SELECT COUNT(*) as cnt FROM user_roles`);
    console.log("Total user_roles entries:", count[0].cnt);

    process.exit(0);
  } catch (e) {
    await t.rollback();
    console.error("Error (rolled back):", e.message);
    process.exit(1);
  }
}

fixFK();
