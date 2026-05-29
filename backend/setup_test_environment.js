// setup_test_environment.js
// سكربت لإعداد بيئة تجريبية كاملة

const {
  sequelize,
  User,
  Category,
  PurchaseRequest,
} = require("./sequelize_setup");
const bcrypt = require("bcrypt");

const setupTestEnvironment = async () => {
  try {
    console.log("🚀 بدء إعداد بيئة التجربة...\n");

    // 1. الاتصال بقاعدة البيانات
    console.log("📊 الاتصال بقاعدة البيانات...");
    await sequelize.authenticate();
    console.log("✅ تم الاتصال بنجاح\n");

    // 2. مزامنة الجداول (إنشاء/تحديث)
    console.log("🔄 مزامنة الجداول...");
    await sequelize.sync({ alter: true });
    console.log("✅ تمت المزامنة بنجاح\n");

    // 3. إنشاء مستخدمين تجريبيين
    console.log("👥 إنشاء مستخدمين تجريبيين...");

    const hashedPassword = await bcrypt.hash("123456", 10);

    // المالك (Owner)
    const owner = await User.findOrCreate({
      where: { email: "owner@test.com" },
      defaults: {
        name: "المالك الرئيسي",
        email: "owner@test.com",
        password: hashedPassword,
        role: "super_admin",
        isAdmin: true,
        adminPermissions: { fullAccess: true },
        adminStatus: "active",
        subscriptionTier: "plan_b",
        isActive: true,
      },
    });
    console.log(`✅ المالك: ${owner[0].email} (ID: ${owner[0].id})`);

    // مسؤول عادي
    const admin = await User.findOrCreate({
      where: { email: "admin@test.com" },
      defaults: {
        name: "مسؤول النظام",
        email: "admin@test.com",
        password: hashedPassword,
        role: "admin",
        isAdmin: true,
        adminPermissions: {
          users: { view: true, edit: true },
          system: { backup: true, logs: true },
        },
        adminCreatedBy: owner[0].id,
        adminStatus: "active",
        subscriptionTier: "plan_a",
        isActive: true,
      },
    });
    console.log(`✅ مسؤول: ${admin[0].email}`);

    // بائع
    const seller = await User.findOrCreate({
      where: { email: "seller@test.com" },
      defaults: {
        name: "بائع تجريبي",
        email: "seller@test.com",
        password: hashedPassword,
        role: "seller",
        subscriptionTier: "plan_a",
        isActive: true,
      },
    });
    console.log(`✅ بائع: ${seller[0].email}`);

    // مشتري مميز
    const premiumBuyer = await User.findOrCreate({
      where: { email: "buyer-premium@test.com" },
      defaults: {
        name: "مشتري مميز",
        email: "buyer-premium@test.com",
        password: hashedPassword,
        role: "buyer",
        subscriptionTier: "plan_b",
        isActive: true,
      },
    });
    console.log(`✅ مشتري مميز: ${premiumBuyer[0].email}`);

    // مشتري عادي
    const buyer = await User.findOrCreate({
      where: { email: "buyer@test.com" },
      defaults: {
        name: "مشتري عادي",
        email: "buyer@test.com",
        password: hashedPassword,
        role: "buyer",
        subscriptionTier: "free",
        isActive: true,
      },
    });
    console.log(`✅ مشتري عادي: ${buyer[0].email}\n`);

    // 4. إنشاء تصنيفات تجريبية
    console.log("📁 إنشاء تصنيفات تجريبية...");

    const categories = [
      {
        name_ar: "إلكترونيات",
        name_en: "Electronics",
        description_ar: "أجهزة إلكترونية ومعدات تقنية",
        description_en: "Electronic devices",
      },
      {
        name_ar: "أثاث",
        name_en: "Furniture",
        description_ar: "أثاث منزلي ومكتبي",
        description_en: "Home furniture",
      },
      {
        name_ar: "ملابس",
        name_en: "Clothing",
        description_ar: "ملابس وإكسسوارات",
        description_en: "Clothes",
      },
      {
        name_ar: "سيارات",
        name_en: "Cars",
        description_ar: "سيارات ومركبات",
        description_en: "Vehicles",
      },
      {
        name_ar: "عقارات",
        name_en: "Real Estate",
        description_ar: "عقارات سكنية وتجارية",
        description_en: "Properties",
      },
    ];

    for (const cat of categories) {
      const [category] = await Category.findOrCreate({
        where: { name_ar: cat.name_ar },
        defaults: cat,
      });
      console.log(`✅ تصنيف: ${category.name_ar}`);
    }

    // 5. إنشاء طلبات شراء تجريبية
    console.log("\n📝 إنشاء طلبات شراء تجريبية...");

    const electronicsCategory = await Category.findOne({
      where: { name_ar: "إلكترونيات" },
    });

    if (electronicsCategory) {
      const requests = [
        {
          title: "لابتوب للبرمجة",
          description: "أبحث عن لابتوب قوي للبرمجة والتطوير",
          quantity: 1,
          preferredPrice: 5000,
          buyerId: premiumBuyer[0].id,
          categoryId: electronicsCategory.id,
          status: "published",
          urgency: "medium",
        },
        {
          title: "هاتف آيفون 15",
          description: "أريد شراء آيفون 15 برو ماكس",
          quantity: 1,
          preferredPrice: 4500,
          buyerId: buyer[0].id,
          categoryId: electronicsCategory.id,
          status: "published",
          urgency: "high",
        },
      ];

      for (const req of requests) {
        const [request] = await PurchaseRequest.findOrCreate({
          where: { title: req.title },
          defaults: req,
        });
        console.log(`✅ طلب: ${request.title}`);
      }
    }

    // 6. عرض معلومات تسجيل الدخول
    console.log("\n" + "=".repeat(60));
    console.log("🎉 تم إعداد بيئة التجربة بنجاح!");
    console.log("=".repeat(60));
    console.log("\n📋 معلومات تسجيل الدخول:");
    console.log("─".repeat(60));
    console.log("كلمة المرور لجميع الحسابات: 123456\n");

    console.log("👑 المالك (Owner):");
    console.log(`   Email: owner@test.com`);
    console.log(`   ID: ${owner[0].id}`);
    console.log(`   الصلاحيات: كاملة\n`);

    console.log("🔧 مسؤول (Admin):");
    console.log(`   Email: admin@test.com`);
    console.log(`   الصلاحيات: محدودة\n`);

    console.log("🏪 بائع (Seller):");
    console.log(`   Email: seller@test.com\n`);

    console.log("💎 مشتري مميز (Premium Buyer):");
    console.log(`   Email: buyer-premium@test.com`);
    console.log(`   الباقة: Plan B\n`);

    console.log("👤 مشتري عادي (Free Buyer):");
    console.log(`   Email: buyer@test.com`);
    console.log(`   الباقة: Free\n`);

    console.log("─".repeat(60));
    console.log("\n⚠️  تذكير مهم:");
    console.log(`   أضف هذا السطر في ملف .env:`);
    console.log(`   OWNER_ID=${owner[0].id}\n`);

    console.log("🚀 الخطوات التالية:");
    console.log("   1. أضف OWNER_ID في ملف .env");
    console.log("   2. شغل السيرفر: npm start");
    console.log("   3. سجل دخول بأي من الحسابات أعلاه");
    console.log("   4. جرب لوحة التحكم الإدارية على /admin\n");
  } catch (error) {
    console.error("❌ حدث خطأ:", error);
    throw error;
  } finally {
    await sequelize.close();
    console.log("🔌 تم إغلاق الاتصال بقاعدة البيانات");
  }
};

// تشغيل السكربت
setupTestEnvironment()
  .then(() => {
    console.log("\n✅ اكتمل الإعداد بنجاح!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ فشل الإعداد:", error.message);
    process.exit(1);
  });
