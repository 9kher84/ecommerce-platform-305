const { sequelize } = require("../sequelize_setup");

async function runQueries() {
  try {
    console.log("=== 1. Check VIEW_QUOTES Permission ===");
    const [q1] = await sequelize.query(`
      SELECT key FROM "Permissions"
      WHERE key = 'VIEW_QUOTES';
    `);
    console.log(q1.length > 0 ? q1 : "No rows found (VIEW_QUOTES is missing)");

    console.log("\n=== 2. Seller Role Permissions ===");
    const [q2] = await sequelize.query(`
      SELECT r.name, p.key
      FROM "RolePermissions" rp
      JOIN "Roles" r ON r.id = rp."roleId"
      JOIN "Permissions" p ON p.id = rp."permissionId"
      WHERE r.name = 'seller';
    `);
    console.log(q2.length > 0 ? q2 : "No permissions found for seller");

    console.log("\n=== 3. Total UserRoles Count ===");
    const [q3] = await sequelize.query(`
      SELECT COUNT(*)
      FROM "UserRoles";
    `);
    console.log("Count:", q3[0].count);

    console.log("\n=== 4. Users without UserRole ===");
    const [q4] = await sequelize.query(`
      SELECT COUNT(*)
      FROM "Users" u
      LEFT JOIN "UserRoles" ur ON ur."userId" = u.id
      WHERE ur.id IS NULL;
    `);
    console.log("Count:", q4[0].count);

  } catch (error) {
    console.error("Error executing queries:", error);
  } finally {
    process.exit(0);
  }
}

runQueries();
