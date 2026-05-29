const { User } = require("./sequelize_setup");

// E.3) Update a test user to have 'seller' role for testing
(async () => {
  try {
    // Find the owner user (or any existing user)
    const user = await User.findOne({
      where: { email: "owner@test.com" },
    });

    if (!user) {
      console.log("❌ User not found. Please ensure owner@test.com exists.");
      process.exit(1);
    }

    console.log(`Found user: ${user.email} with role: ${user.role}`);

    // Update to seller
    await user.update({ role: "seller" });

    console.log(`✅ Updated ${user.email} to role: seller`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error updating user:", error);
    process.exit(1);
  }
})();
