/**
 * 🚀 RENDER BOOTSTRAP SCRIPT
 * 
 * PURPOSE:
 * - Run ONE-TIME historical RBAC migration for existing users.
 * - New users get UserRole assigned at registration (authController.register).
 * - This script is NOT a permanent dependency. Once all users are synced,
 *   it completes silently without doing redundant work (idempotent via findOrCreate).
 */

const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.join(__dirname, "../.env") });

process.env.RENDER = "true";

const { sequelize, User, Role, Permission, RolePermission, UserRole } = require("../sequelize_setup");

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

const bootstrap = async () => {
  try {
    console.log("🚀 [Render Bootstrap] Starting...");
    await sequelize.authenticate();
    console.log("✅ Database connection verified.");

    // === STEP 1: Ensure Roles exist (needed for new registrations too) ===
    const roleMap = {};
    for (const roleName of Object.keys(ROLE_PERMISSIONS)) {
      const [role] = await Role.findOrCreate({
        where: { name: roleName },
        defaults: { name: roleName, description: `${roleName} role` },
      });
      roleMap[roleName] = role;
    }
    console.log(`✅ ${Object.keys(roleMap).length} roles ensured.`);

    // === STEP 2: Ensure Permissions exist ===
    const allPerms = new Map();
    const uniquePerms = new Map();
    for (const perms of Object.values(ROLE_PERMISSIONS)) {
      for (const p of perms) uniquePerms.set(p.key, p);
    }
    for (const [key, pData] of uniquePerms) {
      const [perm] = await Permission.findOrCreate({ where: { key }, defaults: pData });
      allPerms.set(key, perm);
    }
    console.log(`✅ ${allPerms.size} permissions ensured.`);

    // === STEP 3: Link Permissions to Roles ===
    for (const [roleName, perms] of Object.entries(ROLE_PERMISSIONS)) {
      const role = roleMap[roleName];
      if (!role) continue;
      for (const p of perms) {
        const perm = allPerms.get(p.key);
        if (!perm) continue;
        await RolePermission.findOrCreate({ where: { roleId: role.id, permissionId: perm.id } });
      }
    }
    console.log("✅ Role-Permission links ensured.");

    // === STEP 4: ONE-TIME historical backfill — existing users without UserRole ===
    // New users created AFTER this deploy will have UserRole assigned at registration.
    const allUsers = await User.findAll({ attributes: ["id", "role"], paranoid: false });
    let synced = 0;
    let alreadySynced = 0;
    for (const user of allUsers) {
      const role = roleMap[user.role];
      if (!role) continue;
      const [, created] = await UserRole.findOrCreate({ where: { userId: user.id, roleId: role.id } });
      if (created) synced++;
      else alreadySynced++;
    }

    console.log(`✅ Historical backfill: ${synced} new entries, ${alreadySynced} already existed (${allUsers.length} total users).`);
    console.log("🌟 Bootstrap complete. New user registrations handle UserRole automatically.");
    process.exit(0);
  } catch (error) {
    console.error("❌ [Render Bootstrap] Failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

bootstrap();
