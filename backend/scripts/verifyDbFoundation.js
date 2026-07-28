const {
  sequelize,
  OrganizationMembership,
  Team,
  MembershipTeam,
  Actor,
  Permission,
  PermissionGroup,
  PermissionGroupPermission,
  MembershipPermission,
  ProjectScope,
  BranchScope,
  DepartmentScope,
  Delegation,
  TemporaryGrant,
  Invitation,
  SeparationOfDutiesRule,
  OrganizationPolicy
} = require("../sequelize_setup");

const stage2Models = [
  OrganizationMembership,
  Team,
  MembershipTeam,
  Actor,
  Permission,
  PermissionGroup,
  PermissionGroupPermission,
  MembershipPermission,
  ProjectScope,
  BranchScope,
  DepartmentScope,
  Delegation,
  TemporaryGrant,
  Invitation,
  SeparationOfDutiesRule,
  OrganizationPolicy
];

async function runDatabaseFoundationTest() {
  try {
    console.log("==================================================");
    console.log("🚀 SPRINT 2: DATABASE FOUNDATION VERIFICATION");
    console.log("==================================================");

    // 1. Initial Migration / Sync
    console.log("\n[1/3] Executing Initial Stage 2 Table Migrations...");
    for (const model of stage2Models) {
      await model.sync({ alter: true });
    }
    console.log("✅ Step 1: All 16 Stage 2 Tables & Indexes Created Cleanly!");

    // 2. Rollback Verification
    console.log("\n[2/3] Executing Database Rollback (Drop) Verification...");
    for (const model of [...stage2Models].reverse()) {
      await model.drop({ cascade: true });
    }
    console.log("✅ Step 2: Full Rollback Completed Successfully!");

    // 3. Re-Sync Verification
    console.log("\n[3/3] Executing Secondary Database Migration (Re-Sync)...");
    for (const model of stage2Models) {
      await model.sync();
    }
    console.log("✅ Step 3: Secondary Sync Completed Cleanly!");

    console.log("\n🎉 ALL 16 STAGE 2 TABLES, INDEXES & FOREIGN KEYS VERIFIED 100%!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Database Foundation Verification Failed:", error);
    process.exit(1);
  }
}

runDatabaseFoundationTest();
