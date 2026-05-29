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

const { sequelize } = require("../sequelize_setup");

const bootstrap = async () => {
  try {
    console.log("🚀 [Render Bootstrap] Starting database initialization...");
    console.log(`📡 Connecting to: ${process.env.DB_HOST}`);

    // Test connection first
    await sequelize.authenticate();
    console.log("✅ Database connection established.");

    // Step 1: Disable foreign key checks so tables can be created in any order
    console.log("🔧 Disabling FK constraints for safe sync...");
    await sequelize.query("SET session_replication_role = replica;").catch(() => {
      // If this fails (not superuser), we'll continue anyway
      console.log("⚠️  Could not disable FK checks, proceeding with ordered sync...");
    });

    // Step 2: Force = false, alter = true — safe sync that won't drop data
    console.log("🔄 Syncing all models (alter: true, force: false)...");
    await sequelize.sync({ alter: true, force: false });

    // Step 3: Re-enable foreign key checks
    await sequelize.query("SET session_replication_role = DEFAULT;").catch(() => {});

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
