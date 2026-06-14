const { sequelize } = require('../sequelize_setup');

async function run() {
  try {
    // 1. البحث عن buyer1@test.com تحديداً
    const [users] = await sequelize.query(`
      SELECT id, email, role, "createdAt", "subscriptionTier"
      FROM "Users"
      WHERE email = 'buyer1@test.com'
    `);
    console.log('\n=== buyer1@test.com ===');
    console.log(JSON.stringify(users, null, 2));

    if (users.length === 0) {
      console.log('\n❌ المستخدم غير موجود في قاعدة البيانات المحلية.');
      console.log('ملاحظة: قاعدة البيانات المتصلة: localhost/ecommerce_db (Development)');
      console.log('المستخدم الحقيقي موجود في Production (Railway/Neon) فقط.');
      process.exit(0);
    }

    const userId = users[0].id;

    // 2. UserCategories لهذا المستخدم
    const [uc] = await sequelize.query(`
      SELECT uc.*, c.name_ar, c.name_en, c.type, c."parentId"
      FROM "UserCategories" uc
      LEFT JOIN "Categories" c ON c.id = uc."categoryId"
      WHERE uc."userId" = '${userId}'
    `);
    console.log(`\n=== UserCategories for ${users[0].email} ===`);
    console.log(JSON.stringify(uc, null, 2));

    if (uc.length === 0) {
      console.log('\n⚠️ لا يوجد سجل ربط. جاري الإضافة اليدوية لـ categoryId=1...');

      await sequelize.query(`
        INSERT INTO "UserCategories" ("userId", "categoryId", "createdAt", "updatedAt")
        VALUES ('${userId}', 1, NOW(), NOW())
        ON CONFLICT DO NOTHING
      `);
      console.log('✅ تم إضافة سجل UserCategories (userId → categoryId=1)');

      // التحقق بعد الإضافة
      const [ucAfter] = await sequelize.query(`
        SELECT uc.*, c.name_ar, c.type FROM "UserCategories" uc
        LEFT JOIN "Categories" c ON c.id = uc."categoryId"
        WHERE uc."userId" = '${userId}'
      `);
      console.log('\n=== UserCategories بعد الإضافة ===');
      console.log(JSON.stringify(ucAfter, null, 2));
    }

  } catch(e) {
    console.error('ERROR:', e.message);
    console.error('PARENT:', e.parent?.message);
  } finally {
    process.exit(0);
  }
}
run();
