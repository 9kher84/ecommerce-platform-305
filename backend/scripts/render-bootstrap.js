/**
 * 🚀 RENDER BOOTSTRAP SCRIPT
 * 
 * PURPOSE:
 * - Basic database connection verification.
 * - (RBAC logic has been permanently removed and moved to formal migrations).
 */

const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.join(__dirname, "../.env") });

process.env.RENDER = "true";

const { sequelize } = require("../sequelize_setup");

const bootstrap = async () => {
  try {
    console.log("🚀 [Render Bootstrap] Starting...");
    await sequelize.authenticate();
    console.log("✅ Database connection verified.");
    console.log("🌟 Bootstrap complete. Database is reachable.");
    process.exit(0);
  } catch (error) {
    console.error("❌ [Render Bootstrap] Failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

bootstrap();
