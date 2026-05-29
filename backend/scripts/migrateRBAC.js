const {
  User,
  Role,
  UserRole,
  sequelize,
  Sequelize,
} = require("../sequelize_setup");

/**
 * 👑 Sovereign RBAC Migration Script
 * Migrates data from User.role to the new UserRole/Role join table.
 */
async function migrate() {
  console.log("🚀 Starting RBAC Migration...");
  const transaction = await sequelize.transaction();

  try {
    // 1. Ensure Standard Roles Exist
    const rolesToCreate = [
      { name: "buyer", level: 10, description: "Default Buyer Role" },
      { name: "seller", level: 20, description: "Verified Seller Role" },
      { name: "admin", level: 80, description: "System Administrator" },
      {
        name: "super_admin",
        level: 100,
        description: "Sovereign Root Administrator",
      },
      { name: "marketer", level: 15, description: "Marketing Personnel" },
    ];

    for (const r of rolesToCreate) {
      await Role.findOrCreate({
        where: { name: r.name },
        defaults: r,
        transaction,
      });
    }

    const rolesMap = {};
    const allRoles = await Role.findAll({ transaction });
    allRoles.forEach((r) => (rolesMap[r.name] = r.id));

    // 2. Fetch all users with legacy roles
    const users = await User.findAll({
      attributes: ["id", "role"],
      transaction,
    });

    console.log(`📊 Found ${users.length} users to migrate.`);

    let migratedCount = 0;
    for (const user of users) {
      const roleId = rolesMap[user.role];
      if (roleId) {
        await UserRole.findOrCreate({
          where: { userId: user.id, roleId: roleId },
          transaction,
        });
        migratedCount++;
      }
    }

    await transaction.commit();
    console.log(
      `✅ Migration Successful! Migrated ${migratedCount} user roles.`,
    );
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Migration Failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  migrate().then(() => process.exit(0));
}

module.exports = migrate;
