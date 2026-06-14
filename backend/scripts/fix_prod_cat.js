const { Sequelize } = require('sequelize');

async function fixProdCat() {
  const sequelize = new Sequelize('postgresql://neondb_owner:npg_hudwpP4y8bvU@ep-rapid-river-ap7l6xha-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require', {
    dialect: 'postgres',
    logging: false
  });

  try {
    await sequelize.authenticate();
    
    // Add a dummy category if none exists and link buyer1 to it
    const [cats] = await sequelize.query(`SELECT id FROM "Categories" LIMIT 1`);
    let catId = cats.length > 0 ? cats[0].id : null;
    
    const [buyer1] = await sequelize.query(`SELECT id FROM users WHERE email = 'buyer1@test.com'`);
    if (buyer1.length > 0 && catId) {
      await sequelize.query(`
        INSERT INTO "UserCategories" ("userId", "categoryId", "createdAt", "updatedAt")
        VALUES ('${buyer1[0].id}', ${catId}, NOW(), NOW())
        ON CONFLICT DO NOTHING
      `);
      console.log(`✅ Linked buyer1@test.com to Category ID: ${catId}`);
    }
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Fatal Error:", err.message);
    process.exit(1);
  }
}

fixProdCat();
