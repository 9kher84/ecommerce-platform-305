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
const { seedPermissions } = require("./seedPermissions");

const stage2OrderedModels = [
  Permission,
  PermissionGroup,
  PermissionGroupPermission,
  OrganizationMembership,
  Team,
  MembershipTeam,
  Actor,
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

/**
 * Master Migration Runner (Stage 2 Identity & Governance Engine)
 * Runs zero-manual-step ordered migration and permission seed from scratch.
 */
async function runOrderedMigrations() {
  try {
    console.log("==================================================");
    console.log("🛠️ MARKET HUB: ORDERED DATABASE MIGRATION & SEED");
    console.log("==================================================");

    console.log("\n[1/2] Syncing Stage 2 Models in Exact Dependency Sequence...");
    for (const model of stage2OrderedModels) {
      await model.sync();
    }
    console.log("✅ Models and tables synchronized in ordered sequence!");

    console.log("\n[2/2] Seeding Atomic Permission Registry...");
    await seedPermissions();
    console.log("✅ Atomic Permission Registry seeded successfully!");

    console.log("\n🎉 ZERO-MANUAL-STEP DATABASE FOUNDATION COMPLETE & READY!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Ordered Database Migration Failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  runOrderedMigrations();
}

module.exports = { runOrderedMigrations };
