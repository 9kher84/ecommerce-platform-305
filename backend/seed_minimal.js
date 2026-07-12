const { Category, sequelize } = require("./sequelize_setup");

async function seed() {
  try {
    await sequelize.authenticate();
    console.log("Connected to DB.");

    // Seed Sectors
    const sector = await Category.create({
      name_ar: "قطاع التكنولوجيا",
      name_en: "Technology Sector",
      type: "SECTOR",
      status: "active",
      metadata: {}
    });

    console.log("✅ Seeded Sector successfully with ID:", sector.id);
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
