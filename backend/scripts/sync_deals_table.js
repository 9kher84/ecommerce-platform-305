const { Sequelize } = require("sequelize");
const neonDbUrl = "postgresql://neondb_owner:npg_hudwpP4y8bvU@ep-rapid-river-ap7l6xha-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require";

const sequelize = new Sequelize(neonDbUrl, {
  dialect: "postgres",
  logging: console.log,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  }
});

const DataTypes = Sequelize.DataTypes;
const Deal = require("../models/Deal")(sequelize, DataTypes);

async function syncDealsTable() {
  try {
    await sequelize.authenticate();
    console.log("✅ Neon DB Connected.");

    // Sync Deal table to DB (alter mode)
    await Deal.sync({ alter: true });
    console.log("✅ Deals table synced successfully.");

  } catch (error) {
    console.error("❌ SQL Query execution failed:", error);
  } finally {
    process.exit(0);
  }
}

syncDealsTable();
