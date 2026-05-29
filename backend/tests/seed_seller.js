const { User, sequelize } = require("../sequelize_setup");

async function seedSeller() {
  try {
    console.log("🌱 Seeding Seller User...");

    // Ensure DB connection
    await sequelize.authenticate();

    const email = "seeded_seller@test.com";
    const password = "password123";

    // Check if exists
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      console.log("✅ Seller already exists.");
      // Update password just in case
      existing.password = password; // Will be hashed by hook? Yes, usually.
      // Wait, if I update directly, hooks run?
      // Sequelize hooks run on instance.save() or instance.update().
      // But if I set property and save, it should work.
      // However, if password is already hashed, I shouldn't re-hash it unless I know it's plain.
      // Better to destroy and recreate to be sure.
      await existing.destroy();
    }

    const seller = await User.create({
      name: "Seeded Seller",
      email: email,
      password: password,
      role: "seller",
      isActive: true,
    });

    console.log(`✅ Seller created: ${seller.email} / ${password}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seedSeller();
