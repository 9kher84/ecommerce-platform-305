const { sequelize, User, Category } = require('../sequelize_setup');

async function run() {
  try {
    // 1. Get all buyers
    const [buyers] = await sequelize.query(
      `SELECT id, email, role FROM "Users" WHERE role = 'buyer' LIMIT 10`
    );
    console.log('\n=== ALL BUYERS ===');
    console.log(JSON.stringify(buyers, null, 2));

    // 2. Get ALL rows in UserCategories
    const [allUC] = await sequelize.query(
      `SELECT * FROM "UserCategories" LIMIT 30`
    );
    console.log('\n=== ALL UserCategories (max 30) ===');
    console.log(JSON.stringify(allUC, null, 2));

    // 3. For each buyer — check their UserCategories
    for (const buyer of buyers) {
      const [uc] = await sequelize.query(
        `SELECT * FROM "UserCategories" WHERE "userId" = '${buyer.id}'`
      );
      console.log(`\n=== UserCategories for buyer ${buyer.email} (${buyer.id}) ===`);
      console.log(JSON.stringify(uc, null, 2));
    }

    // 4. Get all SECTOR categories
    const [sectors] = await sequelize.query(
      `SELECT id, name_ar, name_en, type FROM "Categories" WHERE type = 'SECTOR' LIMIT 10`
    );
    console.log('\n=== ALL SECTOR Categories ===');
    console.log(JSON.stringify(sectors, null, 2));

  } catch (e) {
    console.error('ERROR:', e.message);
    console.error('PARENT:', e.parent?.message);
  } finally {
    process.exit(0);
  }
}

run();
