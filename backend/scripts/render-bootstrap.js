// /**
//  * 🚀 RENDER BOOTSTRAP SCRIPT
//  * Safely syncs all database tables in the correct order for Render deployment.
//  * Run as part of the Build Command: npm install && node scripts/render-bootstrap.js
//  */
// 
// const dotenv = require("dotenv");
// const path = require("path");
// dotenv.config({ path: path.join(__dirname, "../.env") });
// 
// // Override environment to bypass Vault
// process.env.RENDER = "true";
// 
// const {
//   sequelize,
//   User,
//   Category,
//   PurchaseRequest,
//   PriceQuote,
//   ActionLog,
// } = require("../sequelize_setup");
// 
// const bootstrap = async () => {
//   try {
//     console.log("🚀 [Render Bootstrap] Starting database initialization...");
//     console.log(`📡 Connecting to: ${process.env.DB_HOST}`);
// 
//     // Test connection first
//     await sequelize.authenticate();
//     console.log("✅ Database connection established.");
// 
//     // Ensure ENUM has negotiating value
//     try {
//       await sequelize.query(`ALTER TYPE "enum_PurchaseRequests_status" ADD VALUE IF NOT EXISTS 'negotiating';`);
//       console.log("✅ Added negotiating to enum_PurchaseRequests_status");
//     } catch (e) {
//       console.log("ℹ️ Enum update skipped or already exists:", e.message);
//     }
// 
//     // Step 1: Sync core tables in order to avoid FK errors on free databases
//     console.log("🔄 Syncing core models in correct dependency order...");
//     await User.sync({ alter: true });
//     console.log("✅ User table synced.");
// 
//     await PurchaseRequest.sync({ alter: true });
//     console.log("✅ PurchaseRequest table synced.");
// 
//     await PriceQuote.sync({ alter: true });
//     console.log("✅ PriceQuote table synced.");
// 
//     await ActionLog.sync({ alter: true });
//     console.log("✅ ActionLog table synced.");
// 
//     // Step 2: Sync the rest of the models (now that core tables exist)
//     console.log("🔄 Syncing the rest of the models...");
//     await sequelize.sync({ alter: true, force: false });
// 
//     console.log("✅ [Render Bootstrap] All tables created/updated successfully!");
// 
//     // Step 3: Seed initial data if DB is empty
//     console.log("🌱 Checking if initial seed data is needed...");
// 
//     // Seed categories if empty
//     const catCount = await Category.count();
//     if (catCount === 0) {
//       console.log("📂 Seeding categories...");
//       await Category.bulkCreate([
//         { name_ar: "مواد البناء", name_en: "Construction" },
//         { name_ar: "إلكترونيات", name_en: "Electronics" },
//         { name_ar: "أثاث", name_en: "Furniture" },
//         { name_ar: "مواد غذائية", name_en: "Food & Beverages" },
//         { name_ar: "مستلزمات طبية", name_en: "Medical Supplies" },
//       ]);
//       console.log("✅ 5 categories seeded.");
//     } else {
//       console.log(`ℹ️  Categories already exist (${catCount}), skipping.`);
//     }
// 
//     // Seed admin user if no users exist
//     const userCount = await User.count();
//     if (userCount === 0) {
//       console.log("👤 Seeding admin user...");
//       const bcrypt = require("bcrypt");
//       const adminPassword = process.env.ADMIN_SEED_PASSWORD || "admin123";
//       const hashedPassword = await bcrypt.hash(adminPassword, 12);
//       await User.create({
//         name: "مدير النظام",
//         email: "admin@test.com",
//         password: hashedPassword,
//         role: "admin",
//         subscriptionTier: "plan_b",
//         isActive: true,
//       });
//       console.log("✅ Admin user seeded: admin@test.com / admin123");
//     } else {
//       console.log(`ℹ️  Users already exist (${userCount}), skipping admin seed.`);
//     }
// 
//     console.log("🌟 Database is ready. Starting server...");
//     process.exit(0);
//   } catch (error) {
//     console.error("❌ [Render Bootstrap] Database sync failed:", error.message);
//     console.error(error.stack);
//     process.exit(1);
//   }
// };
// 
// bootstrap();
// 
