const { sequelize, User, Organization, OrganizationUser } = require('./sequelize_setup');
const { mapLegacyUser } = require('./utils/LegacyUserMapper');

async function runVerification() {
  console.log("=== LEGACY USER MAPPER VERIFICATION ===");

  // 1. Create a dummy organization
  const [org] = await Organization.findOrCreate({
    where: { name: 'Tech Corp Org' },
    defaults: {
      commercial_registration: 'CR-123456',
      vat_number: 'VAT-9999',
      status: 'active'
    }
  });

  // 2. Create a user WITH legacy fields and attach to org
  const [userWithOrg] = await User.findOrCreate({
    where: { email: 'orguser_mapper@test.com' },
    defaults: {
      name: 'Org User',
      password: 'password123',
      role: 'seller',
      businessName: 'Old Legacy Business',
      commercialRegister: 'OLD-CR-000'
    }
  });

  await OrganizationUser.findOrCreate({
    where: { user_id: userWithOrg.id, organization_id: org.id },
    defaults: { role: 'owner' }
  });

  // Fetch the user with org included, exactly how authController.js does it
  const fetchedUserWithOrg = await User.findByPk(userWithOrg.id, {
    include: [{ model: Organization, as: "organizations" }]
  });

  // Map the user
  const mappedWithOrg = mapLegacyUser(fetchedUserWithOrg, fetchedUserWithOrg.organizations[0]);
  
  console.log("\n[TEST 1] User with Organization overriding Legacy fields");
  console.log(`Original Legacy businessName: 'Old Legacy Business'`);
  console.log(`Organization name: 'Tech Corp Org'`);
  console.log(`Mapped businessName: '${mappedWithOrg.businessName}'`);
  if (mappedWithOrg.businessName === 'Tech Corp Org') {
    console.log("✅ PASS: Organization fields correctly took precedence over User fields.");
  } else {
    console.error("❌ FAIL: Priority mapping failed.");
  }

  // 3. Create a user WITHOUT an org
  const [userWithoutOrg] = await User.findOrCreate({
    where: { email: 'solobuyer_mapper@test.com' },
    defaults: {
      name: 'Solo Buyer',
      password: 'password123',
      role: 'buyer',
      businessName: 'Solo Business',
      commercialRegister: 'SOLO-CR-999'
    }
  });

  const fetchedUserWithoutOrg = await User.findByPk(userWithoutOrg.id, {
    include: [{ model: Organization, as: "organizations" }]
  });

  const mappedWithoutOrg = mapLegacyUser(fetchedUserWithoutOrg, null);

  console.log("\n[TEST 2] User WITHOUT Organization (Legacy Fallback)");
  console.log(`Original Legacy businessName: 'Solo Business'`);
  console.log(`Mapped businessName: '${mappedWithoutOrg.businessName}'`);
  if (mappedWithoutOrg.businessName === 'Solo Business') {
    console.log("✅ PASS: Fallback to Legacy User fields works when no Organization is present.");
  } else {
    console.error("❌ FAIL: Fallback mapping failed.");
  }

  console.log("\n[TEST 3] JSON Contract Unchanged");
  if (mappedWithoutOrg.name === 'Solo Buyer' && !mappedWithoutOrg.password) {
    console.log("✅ PASS: General JSON contract remains intact and secure.");
  } else {
    console.error("❌ FAIL: JSON contract is broken.");
  }

  console.log("\n=== VERIFICATION COMPLETE ===");
  process.exit(0);
}

runVerification().catch(err => {
  console.error("Verification failed:", err);
  process.exit(1);
});
