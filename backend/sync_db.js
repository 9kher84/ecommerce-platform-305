const { sequelize } = require("./sequelize_setup");

const sync = async () => {
  try {
    console.log("🔄 Syncing database models...");
    // Use alter: true to avoid losing data while adding new fields/tables
    await sequelize.sync({ alter: true });
    console.log("✅ Database synced successfully.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Sync failed:", error);
    process.exit(1);
  }
};

sync();
