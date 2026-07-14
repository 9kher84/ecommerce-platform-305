const { sequelize, SellerListing } = require("./sequelize_setup");

async function syncCatalogSplit() {
  try {
    console.log("Connecting to database...");
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");

    console.log("Syncing SellerListing...");
    await SellerListing.sync({ alter: true });
    console.log("SellerListing synced.");

    console.log("SellerListing model synchronized successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  } finally {
    process.exit(0);
  }
}

syncCatalogSplit();
