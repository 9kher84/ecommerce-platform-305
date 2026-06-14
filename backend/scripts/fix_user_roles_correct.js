require('dotenv').config();
const { sequelize } = require('../sequelize_setup');

async function fixUserRolesCorrectTable() {
  console.log("Checking users in lowercase 'users' table...");
  const [users] = await sequelize.query(`SELECT id, email, role FROM users`);
  console.log(`Found ${users.length} users in lowercase 'users' table`);

  // Check which ones are missing from user_roles
  const [existing] = await sequelize.query(`SELECT "userId" FROM user_roles`);
  const existingIds = new Set(existing.map(r => r.userId));
  
  const missing = users.filter(u => !existingIds.has(u.id));
  console.log(`Missing from user_roles: ${missing.length} users`);
  
  if (missing.length > 0) {
    // Insert missing entries
    for (const u of missing) {
      const [roles] = await sequelize.query(`SELECT id FROM roles WHERE name = $1`, { 
        bind: [u.role], 
        type: sequelize.QueryTypes.SELECT 
      });
      if (roles) {
        await sequelize.query(`
          INSERT INTO user_roles ("userId", "roleId", "createdAt", "updatedAt")
          VALUES ($1, $2, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `, { bind: [u.id, roles.id] });
        console.log(`✅ Linked user ${u.email} (${u.role}) to role`);
      } else {
        console.log(`⚠️ No role found for ${u.email} with role=${u.role}`);
      }
    }
  }

  // Verify buyer1
  const [buyer1] = await sequelize.query(`
    SELECT u.email, r.name as role_name 
    FROM users u
    JOIN user_roles ur ON ur."userId" = u.id
    JOIN roles r ON r.id = ur."roleId"
    WHERE u.email = 'buyer1@testdata.com'
  `);
  console.log("buyer1@testdata.com user_roles:", buyer1);

  process.exit();
}

fixUserRolesCorrectTable().catch(e => { console.error(e.message); process.exit(); });
