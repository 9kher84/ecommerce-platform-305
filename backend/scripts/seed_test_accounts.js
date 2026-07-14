const { sequelize, User, Organization } = require("../sequelize_setup");
const bcrypt = require("bcrypt");

async function seedTestAccounts() {
  console.log("🌱 Seeding Epic 5 Integration Test Accounts...");
  try {
    await sequelize.authenticate();
    
    const passwordHash = await bcrypt.hash("Password123!", 10);
    
    // Add supervisor role to enum if not exists
    try {
      await sequelize.query("ALTER TYPE \"enum_users_role\" ADD VALUE 'supervisor';");
    } catch (e) {}
    
    // Create an organization if needed
    let org = await Organization.findOne({ where: { name: "Test Org A" } });
    if (!org) {
      org = await Organization.create({ name: "Test Org A", type: "buyer" });
    }
    
    let sellerOrgA = await Organization.findOne({ where: { name: "Seller Org A" } });
    if (!sellerOrgA) {
      sellerOrgA = await Organization.create({ name: "Seller Org A", type: "seller" });
    }
    
    let sellerOrgB = await Organization.findOne({ where: { name: "Seller Org B" } });
    if (!sellerOrgB) {
      sellerOrgB = await Organization.create({ name: "Seller Org B", type: "seller" });
    }

    const accounts = [
      {
        first_name: "Admin",
        last_name: "Test",
        email: "admin.epic5@test.com",
        password: passwordHash,
        role: "admin",
        is_verified: true,
      },
      {
        first_name: "Supervisor",
        last_name: "Test",
        email: "supervisor.epic5@test.com",
        password: passwordHash,
        role: "supervisor",
        is_verified: true,
      },
      {
        first_name: "Buyer",
        last_name: "Test",
        email: "buyer.epic5@test.com",
        password: passwordHash,
        role: "buyer",
        organization_id: org.id,
        is_verified: true,
      },
      {
        first_name: "Seller",
        last_name: "A",
        email: "sellerA.epic5@test.com",
        password: passwordHash,
        role: "seller",
        organization_id: sellerOrgA.id,
        is_verified: true,
      },
      {
        first_name: "Seller",
        last_name: "B",
        email: "sellerB.epic5@test.com",
        password: passwordHash,
        role: "seller",
        organization_id: sellerOrgB.id,
        is_verified: true,
      }
    ];

    for (let acc of accounts) {
      const existing = await User.findOne({ where: { email: acc.email } });
      if (!existing) {
        await User.create(acc);
        console.log(`✅ Created ${acc.role}: ${acc.email}`);
      } else {
        await existing.update({ password: acc.password, organization_id: acc.organization_id });
        console.log(`🔄 Updated ${acc.role}: ${acc.email}`);
      }
    }

    console.log("\n✅ All Test Accounts Ready:");
    console.log("-----------------------------------------");
    accounts.forEach(a => {
      console.log(`Role: ${a.role.toUpperCase()} | Email: ${a.email} | Pass: Password123!`);
    });
    console.log("-----------------------------------------");

  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    process.exit(0);
  }
}

seedTestAccounts();
