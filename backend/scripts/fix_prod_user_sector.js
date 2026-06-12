/**
 * سكربت إصلاح Production:
 * - يبحث عن buyer1@test.com
 * - يتحقق من UserCategories
 * - يضيف سجل ربط إذا لم يوجد
 * 
 * التشغيل على Railway Shell:
 * node scripts/fix_prod_user_sector.js
 */

const { sequelize } = require('../sequelize_setup');

const TARGET_EMAIL = 'buyer1@test.com';
const SECTOR_ID = 1; // يمكن تغييره حسب القطاع المطلوب

async function run() {
  try {
    console.log(`\n🔍 البحث عن المستخدم: ${TARGET_EMAIL}`);
    console.log(`🔗 DB Host: ${sequelize.config.host} | DB: ${sequelize.config.database}`);

    // 1. استخراج المستخدم
    const [users] = await sequelize.query(
      `SELECT id, email, role, "createdAt" FROM "Users" WHERE email = $1`,
      { bind: [TARGET_EMAIL] }
    );

    if (users.length === 0) {
      console.log(`\n❌ المستخدم "${TARGET_EMAIL}" غير موجود في قاعدة البيانات.`);
      process.exit(1);
    }

    const user = users[0];
    console.log('\n✅ المستخدم موجود:');
    console.log(JSON.stringify(user, null, 2));

    // 2. التحقق من UserCategories
    const [uc] = await sequelize.query(
      `SELECT uc.*, c.name_ar, c.name_en, c.type 
       FROM "UserCategories" uc
       LEFT JOIN "Categories" c ON c.id = uc."categoryId"
       WHERE uc."userId" = $1`,
      { bind: [user.id] }
    );

    console.log(`\n=== UserCategories لـ ${user.email} ===`);
    console.log(JSON.stringify(uc, null, 2));

    // 3. إضافة سجل ربط إذا لم يوجد
    if (uc.length === 0) {
      console.log(`\n⚠️  لا يوجد ربط. جاري إضافة ربط مع sectorId=${SECTOR_ID}...`);

      // تحقق أن الـ sector موجود أولاً
      const [sectors] = await sequelize.query(
        `SELECT id, name_ar, name_en, type, "parentId" FROM "Categories" WHERE id = $1`,
        { bind: [SECTOR_ID] }
      );

      if (sectors.length === 0) {
        console.log(`\n❌ القطاع id=${SECTOR_ID} غير موجود. اعرض القطاعات المتاحة:`);
        const [allSectors] = await sequelize.query(
          `SELECT id, name_ar, name_en, type FROM "Categories" WHERE type = 'SECTOR' LIMIT 10`
        );
        console.log(JSON.stringify(allSectors, null, 2));
        process.exit(1);
      }

      console.log(`\n✅ القطاع موجود: ${JSON.stringify(sectors[0])}`);

      await sequelize.query(
        `INSERT INTO "UserCategories" ("userId", "categoryId", "createdAt", "updatedAt")
         VALUES ($1, $2, NOW(), NOW())
         ON CONFLICT DO NOTHING`,
        { bind: [user.id, SECTOR_ID] }
      );

      // التحقق بعد الإضافة
      const [ucAfter] = await sequelize.query(
        `SELECT uc.*, c.name_ar, c.type FROM "UserCategories" uc
         LEFT JOIN "Categories" c ON c.id = uc."categoryId"
         WHERE uc."userId" = $1`,
        { bind: [user.id] }
      );

      console.log('\n✅ UserCategories بعد الإضافة:');
      console.log(JSON.stringify(ucAfter, null, 2));
      console.log('\n🎯 تم الإثبات: السبب هو غياب سجل UserCategories.');
      console.log('👉 الآن اختبر إنشاء Purchase Request بنفس الحساب.');
    } else {
      console.log(`\n✅ المستخدم لديه ${uc.length} سجل(ات) في UserCategories.`);
      console.log('⚠️  السبب ليس في بيانات المستخدم. نحتاج مزيداً من التحقيق.');
    }

  } catch (e) {
    console.error('ERROR:', e.message);
    console.error('PARENT:', e.parent?.message);
  } finally {
    process.exit(0);
  }
}

run();
