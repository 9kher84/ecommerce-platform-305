require('dotenv').config();
const { sequelize } = require('../sequelize_setup');

async function checkFK() {
  // Find what table the FK in user_roles points to
  const [fk] = await sequelize.query(`
    SELECT
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'user_roles';
  `);
  console.log("user_roles FK constraints:", JSON.stringify(fk, null, 2));

  // So the users in lowercase users table have IDs not in "Users" table
  // Let's see if lowercase users table IDs exist in "Users"
  const [check] = await sequelize.query(`
    SELECT u.id, u.email FROM users u
    WHERE NOT EXISTS (SELECT 1 FROM "Users" uu WHERE uu.id = u.id)
  `);
  console.log("Users in 'users' (lowercase) but NOT in 'Users' (capital):", check.length);

  process.exit();
}
checkFK().catch(e => { console.error(e.message); process.exit(); });
