require('dotenv').config();
const { sequelize } = require('../sequelize_setup');

async function check() {
  const [tables] = await sequelize.query(`
    SELECT table_name, column_name 
    FROM information_schema.columns 
    WHERE table_name IN ('roles', 'permissions', 'role_permissions', 'RolePermissions', 'Roles', 'Permissions', 'user_roles', 'UserRoles')
    ORDER BY table_name;
  `);
  console.log(tables);
  process.exit();
}
check();
