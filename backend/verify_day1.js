const { initSequelize, RefreshToken } = require("./sequelize_setup");
const uuid = require("uuid");

async function verify() {
  try {
    console.log("1. Checking uuid package...");
    const id = uuid.v4();
    console.log("   ✅ uuid is installed. Generated:", id);

    console.log("2. Syncing Database...");
    await initSequelize();
    console.log("   ✅ Database synced.");

    console.log("3. Checking RefreshToken model...");
    if (RefreshToken) {
      console.log("   ✅ RefreshToken model is exported.");
    } else {
      console.error("   ❌ RefreshToken model is NOT exported.");
      process.exit(1);
    }

    console.log("🎉 Day 1 Verification Successful!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Verification Failed:", error);
    process.exit(1);
  }
}

verify();
