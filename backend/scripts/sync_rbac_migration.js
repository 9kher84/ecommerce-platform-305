/**
 * Sovereign RBAC Historical Migration Script
 * Purpose: Run ONCE to fix historical data.
 * - Creates VIEW_QUOTES if missing.
 * - Links VIEW_QUOTES to the 'seller' role.
 * - Creates UserRole records for all existing users who missed them.
 * 
 * Idempotent: Safe to run multiple times.
 */

const { User, Role, Permission, RolePermission, UserRole, sequelize } = require("../sequelize_setup");

async function syncHistoricalRBAC() {
  const t = await sequelize.transaction();
  try {
    console.log("🚀 Starting Sovereign RBAC Historical Migration...\n");

    // 1. Ensure Roles exist
    const [sellerRole] = await Role.findOrCreate({
      where: { name: "seller" },
      defaults: { name: "seller", description: "Seller role" },
      transaction: t,
    });
    console.log("✅ Roles ensured.");

    // 2. Ensure VIEW_QUOTES Permission exists
    const [viewQuotesPerm] = await Permission.findOrCreate({
      where: { key: "VIEW_QUOTES" },
      defaults: { key: "VIEW_QUOTES", description: "View submitted quotes" },
      transaction: t,
    });
    console.log("✅ VIEW_QUOTES permission ensured.");

    // 3. Link VIEW_QUOTES to Seller
    await RolePermission.findOrCreate({
      where: { roleId: sellerRole.id, permissionId: viewQuotesPerm.id },
      transaction: t,
    });
    console.log("✅ Seller linked to VIEW_QUOTES.");

    // 4. Backfill UserRoles for all users
    const allUsers = await User.findAll({ attributes: ["id", "role"], paranoid: false, transaction: t });
    const roles = await Role.findAll({ transaction: t });
    const roleMap = {};
    for (const r of roles) roleMap[r.name] = r;

    let synced = 0;
    for (const user of allUsers) {
      const role = roleMap[user.role];
      if (!role) continue;
      const [, created] = await UserRole.findOrCreate({
        where: { userId: user.id, roleId: role.id },
        transaction: t,
      });
      if (created) synced++;
    }

    console.log(`✅ Backfilled UserRole for ${synced} historical users.`);

    await t.commit();
    console.log("🌟 Migration Complete!");
    process.exit(0);
  } catch (err) {
    await t.rollback();
    console.error("❌ Migration Failed:", err);
    process.exit(1);
  }
}

syncHistoricalRBAC();
