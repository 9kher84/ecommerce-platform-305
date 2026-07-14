const { sequelize, Organization } = require('./sequelize_setup');

async function syncOrg() {
  try {
    await Organization.sync({ alter: true });
    console.log("Organization table synced successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Error syncing Organization table:", err);
    process.exit(1);
  }
}

syncOrg();
