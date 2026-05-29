const {
  sequelize,
  User,
  Organization,
  OrganizationUser,
  PurchaseRequest,
  PriceQuote,
  Deal,
  AuditLog,
} = require("../sequelize_setup");

async function migrate() {
  try {
    console.log("Syncing database...");
    await sequelize.sync({ alter: true });

    console.log("Creating Default Organization...");
    let defaultOrg = await Organization.findOne({
      where: { name: "Default Organization" },
    });
    if (!defaultOrg) {
      defaultOrg = await Organization.create({
        name: "Default Organization",
        subscription_plan: "free",
        status: "active",
      });
      console.log(`Created organization with ID: ${defaultOrg.id}`);
    } else {
      console.log(`Default organization already exists: ${defaultOrg.id}`);
    }

    console.log("Assigning users to Default Organization...");
    const users = await User.findAll();
    for (const user of users) {
      const exists = await OrganizationUser.findOne({
        where: { user_id: user.id, organization_id: defaultOrg.id },
      });
      if (!exists) {
        await OrganizationUser.create({
          organization_id: defaultOrg.id,
          user_id: user.id,
          title: "Member",
          role: user.role,
          is_primary: true,
        });
      }
    }

    console.log("Migration complete.");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
