const { User, Organization, OrganizationMembership } = require("../sequelize_setup");
const bcrypt = require("bcrypt");

/**
 * Persona Accounts Seeding Script
 * Creates ready-to-use local E2E Persona accounts for Buyer, Seller, and Admin testing.
 */
async function seedPersonaUsers() {
  console.log("🌱 Seeding Persona E2E Accounts...");

  const hashedPassword = await bcrypt.hash("Password123!", 10);

  // 1. Seed Buyer Persona
  let buyerUser = await User.findOne({ where: { email: "buyer@markethub.sa" } });
  if (!buyerUser) {
    buyerUser = await User.create({
      name: "خالد المطيري (مشتري معتمد)",
      email: "buyer@markethub.sa",
      password: hashedPassword,
      role: "buyer",
      status: "ACTIVE"
    });
  }

  let buyerOrg = await Organization.findOne({ where: { name: "شركة الإعمار والتطوير" } });
  if (!buyerOrg) {
    buyerOrg = await Organization.create({
      name: "شركة الإعمار والتطوير",
      status: "VERIFIED",
      tier: "PRO",
      type: "BUYER"
    });
  }

  // 2. Seed Seller Persona
  let sellerUser = await User.findOne({ where: { email: "seller@markethub.sa" } });
  if (!sellerUser) {
    sellerUser = await User.create({
      name: "عبدالله الغامدي (مورد ذهبي)",
      email: "seller@markethub.sa",
      password: hashedPassword,
      role: "seller",
      status: "ACTIVE"
    });
  }

  let sellerOrg = await Organization.findOne({ where: { name: "مؤسسة التوريدات الشرقية" } });
  if (!sellerOrg) {
    sellerOrg = await Organization.create({
      name: "مؤسسة التوريدات الشرقية",
      status: "VERIFIED",
      tier: "ENTERPRISE",
      type: "SELLER"
    });
  }

  // 3. Seed Admin Persona
  let adminUser = await User.findOne({ where: { email: "admin@markethub.sa" } });
  if (!adminUser) {
    adminUser = await User.create({
      name: "مدير المنصة السيادي",
      email: "admin@markethub.sa",
      password: hashedPassword,
      role: "admin",
      status: "ACTIVE"
    });
  }

  console.log("✅ Persona Accounts Seeded Successfully:");
  console.log(" 🛒 Buyer:  buyer@markethub.sa / Password123!");
  console.log(" 🏬 Seller: seller@markethub.sa / Password123!");
  console.log(" ⚙️ Admin:  admin@markethub.sa / Password123!");
}

if (require.main === module) {
  seedPersonaUsers()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ Seeding Failed:", err);
      process.exit(1);
    });
}

module.exports = seedPersonaUsers;
