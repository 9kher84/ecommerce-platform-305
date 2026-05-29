const { sequelize, SystemSetting } = require("./sequelize_setup");

async function enablePaymentSystem() {
  try {
    console.log("🔧 Enabling Payment System...");

    // Ensure DB is connected
    await sequelize.authenticate();

    // Update or Create the setting
    const [setting, created] = await SystemSetting.findOrCreate({
      where: { key: "payment_system_enabled" },
      defaults: { value: "true", description: "Enable/Disable Payment System" },
    });

    if (!created) {
      setting.value = "true";
      await setting.save();
    }

    console.log("✅ Payment System Enabled Successfully!");
  } catch (error) {
    console.error("❌ Failed to enable payment system:", error);
  } finally {
    await sequelize.close();
  }
}

enablePaymentSystem();
