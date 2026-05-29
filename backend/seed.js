const bcrypt = require("bcrypt");
const {
  initSequelize,
  sequelize,
  User,
  Category,
  PurchaseRequest,
  PriceQuote,
} = require("./sequelize_setup");

async function seed() {
  console.log("\n🌱 Starting seed...\n");

  await initSequelize();

  // Clean
  console.log("🧹 Cleaning...");
  await sequelize.query('TRUNCATE TABLE "Deals" RESTART IDENTITY CASCADE');
  await sequelize.query(
    'TRUNCATE TABLE "PriceQuotes" RESTART IDENTITY CASCADE',
  );
  await sequelize.query(
    'TRUNCATE TABLE "PurchaseRequests" RESTART IDENTITY CASCADE',
  );
  await sequelize.query('TRUNCATE TABLE "Categories" RESTART IDENTITY CASCADE');
  await sequelize.query('TRUNCATE TABLE "Users" RESTART IDENTITY CASCADE');
  console.log("✓ Cleaned\n");

  // Users
  console.log("👥 Creating users...");
  const pwd = "Test@123";
  const adminPwd =
    process.env.ADMIN_SEED_PASSWORD || "ChangeMe_Immediately_123!";

  const buyerFree = await User.create({
    name: "مشتري مجاني",
    email: "buyer_free@test.com",
    password: pwd,
    role: "buyer",
    subscriptionTier: "free",
  });
  const buyerA = await User.create({
    name: "مشتري أ",
    email: "buyer_a@test.com",
    password: pwd,
    role: "buyer",
    subscriptionTier: "plan_a",
  });
  const buyerB = await User.create({
    name: "مشتري ب",
    email: "buyer_b@test.com",
    password: pwd,
    role: "buyer",
    subscriptionTier: "plan_b",
  });
  const sellerFree = await User.create({
    name: "بائع مجاني",
    email: "seller_free@test.com",
    password: pwd,
    role: "seller",
    subscriptionTier: "free",
    businessName: "متجر 1",
  });
  const sellerA = await User.create({
    name: "بائع أ",
    email: "seller_a@test.com",
    password: pwd,
    role: "seller",
    subscriptionTier: "plan_a",
    businessName: "متجر 2",
  });
  const sellerB = await User.create({
    name: "بائع ب",
    email: "seller_b@test.com",
    password: pwd,
    role: "seller",
    subscriptionTier: "plan_b",
    businessName: "متجر 3",
  });
  if (process.env.NODE_ENV !== "production") {
    await User.create({
      name: "مدير",
      email: "admin@test.com",
      password: adminPwd,
      role: "admin",
      subscriptionTier: "plan_b",
    });
  }
  console.log("✓ Created 7 users\n");

  // Categories
  console.log("📂 Creating categories...");
  const cat1 = await Category.create({
    name_ar: "مواد البناء",
    name_en: "Construction",
  });
  const cat2 = await Category.create({
    name_ar: "إلكترونيات",
    name_en: "Electronics",
  });
  const cat3 = await Category.create({ name_ar: "أثاث", name_en: "Furniture" });
  console.log("✓ Created 3 categories\n");

  // Requests
  console.log("📝 Creating requests...");
  const exp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const req1 = await PurchaseRequest.create({
    userId: buyerFree.id,
    categoryId: cat1.id,
    title: "مطلوب 100 كيس إسمنت",
    description: "إسمنت ممتاز",
    quantity: 100,
    unit: "كيس",
    delivery_city: "الرياض",
    status: "published",
    expiresAt: exp,
  });

  await PurchaseRequest.create({
    userId: buyerA.id,
    categoryId: cat2.id,
    title: "مطلوب 10 حواسيب",
    description: "حواسيب مكتبية",
    quantity: 10,
    unit: "جهاز",
    delivery_city: "جدة",
    status: "published",
    expiresAt: exp,
  });

  await PurchaseRequest.create({
    userId: buyerB.id,
    categoryId: cat3.id,
    title: "مطلوب 50 كرسي",
    description: "كراسي مكتبية",
    quantity: 50,
    unit: "كرسي",
    delivery_city: "الدمام",
    status: "published",
    expiresAt: exp,
  });

  await PurchaseRequest.create({
    userId: buyerA.id,
    categoryId: cat1.id,
    title: "مطلوب طوب",
    description: "طوب أحمر",
    quantity: 200,
    unit: "طوبة",
    delivery_city: "الرياض",
    status: "draft",
  });

  console.log("✓ Created 4 requests (3 published, 1 draft)\n");

  // Quotes
  console.log("💰 Creating quotes...");
  await PriceQuote.create({
    purchaseRequestId: req1.id,
    sellerId: sellerFree.id,
    priceType: "fixed",
    fixedPrice: 2800,
    canDeliver: true,
    status: "pending",
  });

  await PriceQuote.create({
    purchaseRequestId: req1.id,
    sellerId: sellerA.id,
    priceType: "fixed",
    fixedPrice: 2600,
    canDeliver: true,
    status: "pending",
  });

  console.log("✓ Created 2 quotes\n");

  console.log("═══════════════════════════════════════");
  console.log("🎉 SEED COMPLETE!");
  console.log("═══════════════════════════════════════\n");
  console.log("📊 Summary:");
  console.log("  • 7 Users");
  console.log("  • 3 Categories");
  console.log("  • 4 Requests (3 published)");
  console.log("  • 2 Quotes\n");
  console.log("🔑 Credentials:");
  console.log("  All users: Test@123");
  console.log("  Admin: Admin@123\n");
}

seed()
  .then(() => {
    console.log("✅ Done\n");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error:", err.message);
    process.exit(1);
  });
