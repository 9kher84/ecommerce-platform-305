/**
 * Sovereign RBAC Sync Script
 * Purpose: Ensure all permissions exist, all roles have correct permissions,
 *          and all existing users are linked to their role in UserRole table.
 * 
 * This script is idempotent — safe to run multiple times.
 * Run on every deploy to keep RBAC synchronized.
 */

const {
  User,
  Role,
  Permission,
  RolePermission,
  UserRole,
  sequelize,
} = require("../sequelize_setup");

const ROLE_PERMISSIONS = {
  buyer: [
    { key: "CREATE_REQUEST", description: "Create purchase request" },
    { key: "VIEW_REQUESTS", description: "View purchase requests" },
    { key: "ACCEPT_QUOTE", description: "Accept a submitted quote" },
    { key: "VIEW_QUOTES", description: "View submitted quotes" },
    { key: "MANAGE_PROFILE", description: "Manage own profile" },
  ],
  seller: [
    { key: "VIEW_REQUESTS", description: "View purchase requests" },
    { key: "CREATE_QUOTE", description: "Submit price quote" },
    { key: "VIEW_QUOTES", description: "View submitted quotes" },
    { key: "MANAGE_PROFILE", description: "Manage own profile" },
  ],
  admin: [
    { key: "CREATE_REQUEST", description: "Create purchase request" },
    { key: "VIEW_REQUESTS", description: "View purchase requests" },
    { key: "CREATE_QUOTE", description: "Submit price quote" },
    { key: "ACCEPT_QUOTE", description: "Accept a submitted quote" },
    { key: "VIEW_QUOTES", description: "View submitted quotes" },
    { key: "MANAGE_USERS", description: "Manage platform users" },
    { key: "MANAGE_PROFILE", description: "Manage own profile" },
  ],
  super_admin: [
    { key: "CREATE_REQUEST", description: "Create purchase request" },
    { key: "VIEW_REQUESTS", description: "View purchase requests" },
    { key: "CREATE_QUOTE", description: "Submit price quote" },
    { key: "ACCEPT_QUOTE", description: "Accept a submitted quote" },
    { key: "VIEW_QUOTES", description: "View submitted quotes" },
    { key: "MANAGE_USERS", description: "Manage platform users" },
    { key: "MANAGE_PROFILE", description: "Manage own profile" },
  ],
  marketer: [
    { key: "VIEW_REQUESTS", description: "View purchase requests" },
    { key: "VIEW_QUOTES", description: "View submitted quotes" },
    { key: "MANAGE_PROFILE", description: "Manage own profile" },
  ],
};

async function syncRBAC() {
  const t = await sequelize.transaction();
  try {
    console.log("🚀 Starting Sovereign RBAC Sync...\n");

    // === STEP 1: Ensure all roles exist ===
    console.log("Step 1: Syncing Roles...");
    const roleMap = {};
    for (const roleName of Object.keys(ROLE_PERMISSIONS)) {
      const [role] = await Role.findOrCreate({
        where: { name: roleName },
        defaults: { name: roleName, description: `${roleName} role` },
        transaction: t,
      });
      roleMap[roleName] = role;
    }
    console.log(`  ✅ ${Object.keys(roleMap).length} roles ensured.`);

    // === STEP 2: Ensure all permissions exist ===
    console.log("Step 2: Syncing Permissions...");
    const allPerms = new Map();
    const uniquePerms = new Map();
    for (const perms of Object.values(ROLE_PERMISSIONS)) {
      for (const p of perms) {
        uniquePerms.set(p.key, p);
      }
    }
    for (const [key, pData] of uniquePerms) {
      const [perm] = await Permission.findOrCreate({
        where: { key },
        defaults: pData,
        transaction: t,
      });
      allPerms.set(key, perm);
    }
    console.log(`  ✅ ${allPerms.size} permissions ensured.`);

    // === STEP 3: Link permissions to roles ===
    console.log("Step 3: Linking Permissions to Roles...");
    let rolePermCount = 0;
    for (const [roleName, perms] of Object.entries(ROLE_PERMISSIONS)) {
      const role = roleMap[roleName];
      if (!role) continue;
      for (const p of perms) {
        const perm = allPerms.get(p.key);
        if (!perm) continue;
        await RolePermission.findOrCreate({
          where: { roleId: role.id, permissionId: perm.id },
          transaction: t,
        });
        rolePermCount++;
      }
    }
    console.log(`  ✅ ${rolePermCount} role-permission links ensured.`);

    // === STEP 4: Sync all existing users to UserRole table ===
    console.log("Step 4: Syncing existing Users to UserRole table...");
    const allUsers = await User.findAll({
      attributes: ["id", "role"],
      paranoid: false, // include soft-deleted for full coverage
      transaction: t,
    });

    let userRoleSynced = 0;
    let userRoleSkipped = 0;
    for (const user of allUsers) {
      const roleEnum = user.role; // buyer, seller, admin, super_admin, marketer
      if (!roleEnum || !roleMap[roleEnum]) {
        userRoleSkipped++;
        continue;
      }
      const role = roleMap[roleEnum];
      const [, created] = await UserRole.findOrCreate({
        where: { userId: user.id, roleId: role.id },
        transaction: t,
      });
      if (created) userRoleSynced++;
    }
    console.log(`  ✅ Synced ${userRoleSynced} new UserRole entries.`);
    console.log(`  ℹ️  Skipped ${userRoleSkipped} users (already synced or unknown role).`);
    console.log(`  ℹ️  Total users processed: ${allUsers.length}`);

    await t.commit();
    console.log("\n✅ Sovereign RBAC Sync Complete.");
    process.exit(0);
  } catch (err) {
    await t.rollback();
    console.error("❌ RBAC Sync Failed:", err);
    process.exit(1);
  }
}

syncRBAC();
