require('dotenv').config();
const { sequelize } = require('../sequelize_setup');

async function fixPermissions() {
  console.log("Running Diagnostic Query...");
  const [diag] = await sequelize.query(`
    SELECT r.name role_name, p.key permission_key
    FROM roles r
    JOIN role_permissions rp ON rp."roleId" = r.id
    JOIN permissions p ON p.id = rp."permissionId"
    WHERE r.name = 'buyer'
    ORDER BY p.key;
  `);
  console.table(diag);

  console.log("Adding CREATE_REQUEST permission if not exists...");
  await sequelize.query(`
    INSERT INTO permissions (key, description, "createdAt", "updatedAt")
    VALUES ('CREATE_REQUEST', 'Ability to create a purchase request', NOW(), NOW())
    ON CONFLICT DO NOTHING;
  `);

  console.log("Linking CREATE_REQUEST to buyer role...");
  await sequelize.query(`
    INSERT INTO role_permissions ("roleId", "permissionId", "createdAt", "updatedAt")
    SELECT r.id, p.id, NOW(), NOW()
    FROM roles r, permissions p
    WHERE r.name = 'buyer' AND p.key = 'CREATE_REQUEST'
    ON CONFLICT DO NOTHING;
  `);

  console.log("Re-running Diagnostic Query...");
  const [diagAfter] = await sequelize.query(`
    SELECT r.name role_name, p.key permission_key
    FROM roles r
    JOIN role_permissions rp ON rp."roleId" = r.id
    JOIN permissions p ON p.id = rp."permissionId"
    WHERE r.name = 'buyer' AND p.key = 'CREATE_REQUEST';
  `);
  console.table(diagAfter);

  console.log("✅ Permissions updated successfully.");
  process.exit(0);
}

fixPermissions().catch(e => {
  console.error("Error:", e.message);
  process.exit(1);
});
