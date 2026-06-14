require('dotenv').config();
const { sequelize, User, Role, Permission } = require('../sequelize_setup');

async function debugRBAC() {
  // Step 1: Find buyer1 user
  const user = await User.findOne({ where: { email: 'buyer1@testdata.com' } });
  console.log("User ID:", user?.id, "| Role field:", user?.role);

  // Step 2: Check user_roles for this user
  const [userRoles] = await sequelize.query(`SELECT * FROM user_roles WHERE "userId" = '${user.id}'`);
  console.log("user_roles entries:", userRoles);

  // Step 3: Check buyer role has CREATE_REQUEST
  const [rp] = await sequelize.query(`
    SELECT r.name, p.key FROM roles r
    JOIN role_permissions rp ON rp."roleId" = r.id
    JOIN permissions p ON p.id = rp."permissionId"
    WHERE r.name = 'buyer' AND p.key = 'CREATE_REQUEST';
  `);
  console.log("buyer role has CREATE_REQUEST:", rp);

  // Step 4: Simulate RBAC query
  const userWithPerms = await User.findByPk(user.id, {
    include: [{
      model: Role,
      as: 'roles',
      include: [{
        model: Permission,
        as: 'permissions',
        where: { key: 'CREATE_REQUEST' },
        required: true,
      }],
      required: true,
    }]
  });
  console.log("RBAC query result (should not be null):", userWithPerms ? "FOUND ✅" : "NULL ❌ (Permission denied)");

  process.exit();
}

debugRBAC().catch(e => { console.error(e.message); process.exit(); });
