const { sequelize, ProductDNA, AttributeSchema, ProductDNAAttribute } = require("./sequelize_setup");

async function syncCatalog() {
  try {
    console.log("Connecting to database...");
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");

    console.log("Syncing AttributeSchema...");
    await AttributeSchema.sync({ alter: true });
    console.log("AttributeSchema synced.");

    console.log("Syncing ProductDNA...");
    await ProductDNA.sync({ alter: true });
    console.log("ProductDNA synced.");

    console.log("Syncing ProductDNAAttribute...");
    await ProductDNAAttribute.sync({ alter: true });
    console.log("ProductDNAAttribute synced.");

    console.log("Catalog models synchronized successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  } finally {
    process.exit(0);
  }
}

syncCatalog();
