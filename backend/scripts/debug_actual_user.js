const { sequelize } = require('../sequelize_setup');

async function run() {
  try {
    // 1. أحدث المستخدمين buyer تم إنشاؤهم
    const [buyers] = await sequelize.query(`
      SELECT id, email, role, "createdAt", "subscriptionTier"
      FROM "Users"
      WHERE role = 'buyer'
      ORDER BY "createdAt" DESC
      LIMIT 5
    `);
    console.log('\n=== LATEST 5 BUYERS (newest first) ===');
    console.log(JSON.stringify(buyers, null, 2));

    // 2. لكل buyer: هل لديه UserCategories؟
    for (const b of buyers) {
      const [uc] = await sequelize.query(`
        SELECT uc.*, c.id as "cat_id", c.name_ar, c.type, c."parentId"
        FROM "UserCategories" uc
        LEFT JOIN "Categories" c ON c.id = uc."categoryId"
        WHERE uc."userId" = '${b.id}'
      `);
      console.log(`\n--- UserCategories for ${b.email} (${b.id}) ---`);
      console.log(JSON.stringify(uc, null, 2));
    }

    // 3. هل Category id=1 لديها parentId؟
    const [cat1] = await sequelize.query(`
      SELECT id, name_ar, name_en, type, "parentId"
      FROM "Categories"
      WHERE id = 1
    `);
    console.log('\n=== Category id=1 ===');
    console.log(JSON.stringify(cat1, null, 2));

    // 4. جميع الـ UserCategories كاملاً
    const [allUC] = await sequelize.query(`
      SELECT uc.*, c.name_ar, c.type, c."parentId"
      FROM "UserCategories" uc
      LEFT JOIN "Categories" c ON c.id = uc."categoryId"
    `);
    console.log('\n=== ALL UserCategories in DB ===');
    console.log(JSON.stringify(allUC, null, 2));

  } catch(e) {
    console.error('ERROR:', e.message);
    console.error('PARENT:', e.parent?.message);
  } finally {
    process.exit(0);
  }
}
run();
