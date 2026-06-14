require('dotenv').config();
const { sequelize } = require('../sequelize_setup');

async function fixUserRoles() {
  console.log("Populating user_roles for existing users...");
  
  await sequelize.query(`
    INSERT INTO user_roles ("userId", "roleId", "createdAt", "updatedAt")
    SELECT u.id, r.id, NOW(), NOW()
    FROM "Users" u
    JOIN roles r ON r.name = u.role::text
    WHERE NOT EXISTS (
      SELECT 1 FROM user_roles ur WHERE ur."userId" = u.id AND ur."roleId" = r.id
    )
    ON CONFLICT DO NOTHING;
  `);

  console.log("Done linking users to roles.");
  process.exit();
}

fixUserRoles().catch(e => {
  console.error(e.message);
  process.exit();
});
