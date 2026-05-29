const { sequelize } = require("../config/database"); // Assuming standard path
const { AdminCredentialsBackup, PaymentGatewayKeys } =
  require("../models/HoneypotModels")(sequelize);
const logger = require("../config/logger");

async function deployHoneypots() {
  try {
    console.log("🍯 Deploying Sovereign Honeypots...");

    // Create tables
    await AdminCredentialsBackup.sync({ force: true });
    await PaymentGatewayKeys.sync({ force: true });

    // Seed Data
    await AdminCredentialsBackup.create(
      {
        username: "sysadmin",
        password_hash: "$2b$10$X7.mQ1/HoneypotTrap.DoNotTouch",
        recovery_key: "RK-9988-SAFE-MODE",
      },
      { hooks: false },
    ); // Disable hooks for seeding

    await PaymentGatewayKeys.create(
      {
        provider: "PAYPAL_PROD",
        api_key: "AX_Live_Honeypot_Token",
        secret_key: "EM_Live_Honeypot_Secret",
      },
      { hooks: false },
    );

    console.log("✅ Honeypots Deployed. Traps are armed.");
  } catch (error) {
    logger.error("Failed to deploy honeypots:", error);
    process.exit(1);
  }
}

// Allow running directly
if (require.main === module) {
  deployHoneypots();
}

module.exports = deployHoneypots;
