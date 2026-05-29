const { sequelize, User, AuditLog } = require("../sequelize_setup");
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const uuid = require("uuid");

async function updateOwner() {
  await sequelize.authenticate();

  // 1. Identify current Owner (by Environment ID or previous email)
  const ownerId = process.env.OWNER_ID;
  const oldEmail = "owner@platform.internal";
  const newEmail = "owner@sovereign.net";

  console.log(`🔍 [UPDATE OWNER] Starting Migration...`);
  console.log(`   TARGET: ${ownerId}`);
  console.log(`   OLD EMAIL: ${oldEmail}`);
  console.log(`   NEW EMAIL: ${newEmail}`);

  let user = await User.findByPk(ownerId);
  if (!user) {
    // Fallback: Try finding by old email if ID mismatch
    user = await User.findOne({ where: { email: oldEmail } });
    if (user) console.log("✅ Found Owner by Email fallback.");
  } else {
    console.log("✅ Found Owner by ID.");
  }

  if (!user) {
    console.error("❌ CRITICAL: Owner not found in Database. Cannot update.");
    process.exit(1);
  }

  // 2. Update Email Avoid Hook interference by using raw query if possible, but safe save is better for history
  const previousEmail = user.email;

  // Using RAW SQL to avoid triggers/hooks side effects just to be safe with password hashing
  await sequelize.query(
    'UPDATE "Users" SET "email" = :newEmail WHERE "id" = :id',
    {
      replacements: { newEmail: newEmail, id: user.id },
      type: sequelize.QueryTypes.UPDATE,
    },
  );

  console.log("✅ DATABASE UPDATE SUCCESSFUL via RAW SQL.");

  // 3. Audit Log
  try {
    await AuditLog.create({
      id: uuid.v4(),
      userId: user.id, // The owner themselves (or system)
      action: "SOVEREIGN_IDENTITY_MIGRATION",
      resourceType: "User",
      resourceId: user.id,
      details: {
        from: previousEmail,
        to: newEmail,
        reason: "Sovereign Order 19",
      },
      ipAddress: "127.0.0.1",
      createdAt: new Date(),
    });
    console.log("✅ AUDIT LOG CREATED.");
  } catch (e) {
    console.warn("⚠️ Audit Log Warning (Non-fatal):", e.message);
  }

  process.exit(0);
}

updateOwner();
