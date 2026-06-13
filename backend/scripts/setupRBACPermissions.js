const {
  Role,
  Permission,
  RolePermission,
  sequelize,
} = require("../sequelize_setup");

async function setupRBAC() {
  try {
    console.log("🚀 Setting up standard RBAC Roles and Permissions...");

    // 1. Create Roles
    const roles = [
      { name: "buyer", description: "Buyer role" },
      { name: "seller", description: "Seller role" },
      { name: "admin", description: "Admin role" },
    ];

    for (const r of roles) {
      await Role.findOrCreate({ where: { name: r.name }, defaults: r });
    }

    // 2. Create Permissions
    const permissions = [
      { key: "CREATE_REQUEST", description: "Create purchase request" },
      { key: "VIEW_REQUESTS", description: "View requests" },
      { key: "CREATE_QUOTE", description: "Submit price quote" },
      { key: "ACCEPT_QUOTE", description: "Accept a quote" },
      { key: "VIEW_QUOTES", description: "View submitted quotes" },
    ];

    for (const p of permissions) {
      await Permission.findOrCreate({ where: { key: p.key }, defaults: p });
    }

    // 3. Link Permissions to Roles
    const buyerRole = await Role.findOne({ where: { name: "buyer" } });
    const sellerRole = await Role.findOne({ where: { name: "seller" } });

    const pCreateReq = await Permission.findOne({
      where: { key: "CREATE_REQUEST" },
    });
    const pViewReq = await Permission.findOne({
      where: { key: "VIEW_REQUESTS" },
    });
    const pCreateQuote = await Permission.findOne({
      where: { key: "CREATE_QUOTE" },
    });
    const pAcceptQuote = await Permission.findOne({
      where: { key: "ACCEPT_QUOTE" },
    });
    const pViewQuotes = await Permission.findOne({
      where: { key: "VIEW_QUOTES" },
    });

    // Buyer permissions
    if (buyerRole && pCreateReq)
      await RolePermission.findOrCreate({
        where: { roleId: buyerRole.id, permissionId: pCreateReq.id },
      });
    if (buyerRole && pViewReq)
      await RolePermission.findOrCreate({
        where: { roleId: buyerRole.id, permissionId: pViewReq.id },
      });
    if (buyerRole && pAcceptQuote)
      await RolePermission.findOrCreate({
        where: { roleId: buyerRole.id, permissionId: pAcceptQuote.id },
      });

    // Seller permissions
    if (sellerRole && pViewReq)
      await RolePermission.findOrCreate({
        where: { roleId: sellerRole.id, permissionId: pViewReq.id },
      });
    if (sellerRole && pCreateQuote)
      await RolePermission.findOrCreate({
        where: { roleId: sellerRole.id, permissionId: pCreateQuote.id },
      });
    if (sellerRole && pViewQuotes)
      await RolePermission.findOrCreate({
        where: { roleId: sellerRole.id, permissionId: pViewQuotes.id },
      });

    console.log("✅ RBAC Setup Complete.");
    process.exit(0);
  } catch (error) {
    console.error("❌ RBAC Setup Failed:", error);
    process.exit(1);
  }
}

setupRBAC();
