/**
 * 🚀 RENDER BOOTSTRAP SCRIPT
 * Safely syncs all database tables in the correct order for Render deployment.
 * Run as part of the Build Command: npm install && node scripts/render-bootstrap.js
 */

const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.join(__dirname, "../.env") });

// Override environment to bypass Vault
process.env.RENDER = "true";

const {
  sequelize,
  User,
  PurchaseRequest,
  PriceQuote,
  ActionLog,
} = require("../sequelize_setup");

const bootstrap = async () => {
  try {
    console.log("🚀 [Render Bootstrap] Starting database initialization...");
    console.log(`📡 Connecting to: ${process.env.DB_HOST}`);

    // Test connection first
    await sequelize.authenticate();
    console.log("✅ Database connection established.");

    // Step 1: Sync core tables in order to avoid FK errors on free databases
    console.log("🔄 Syncing core models in correct dependency order...");
    await User.sync({ alter: true });
    console.log("✅ User table synced.");
    
    await PurchaseRequest.sync({ alter: true });
    console.log("✅ PurchaseRequest table synced.");
    
    await PriceQuote.sync({ alter: true });
    console.log("✅ PriceQuote table synced.");
    
    await ActionLog.sync({ alter: true });
    console.log("✅ ActionLog table synced.");

    // Step 2: Sync the rest of the models (now that core tables exist)
    console.log("🔄 Syncing the rest of the models...");
    await sequelize.sync({ alter: true, force: false });

    console.log("✅ [Render Bootstrap] All tables created/updated successfully!");
    console.log("🌟 Database is ready. Starting server...");

    process.exit(0);
  } catch (error) {
    console.error("❌ [Render Bootstrap] Database sync failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

bootstrap();
