const { sequelize } = require("./sequelize_setup");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

async function run() {
  await sequelize.authenticate();
  
  // Check all existing buyers
  const [buyers] = await sequelize.query(
    `SELECT id, email, role, "isActive" FROM "Users" WHERE role = 'buyer' LIMIT 5`
  );
  console.log("Existing buyers:", buyers.map(b => ({ email: b.email, active: b.isActive })));

  // Check if buyer1@test.com exists at all
  const [check] = await sequelize.query(
    `SELECT id, email FROM "Users" WHERE email ILIKE '%buyer1%test%' LIMIT 5`
  );
  console.log("Matching buyer1 users:", check);

  // Create fresh test buyer
  const pw = await bcrypt.hash("Test@1234", 10);
  const id = uuidv4();
  
  try {
    await sequelize.query(`
      INSERT INTO "Users" 
        (id, email, password, name, role, "isActive", "createdAt", "updatedAt", "subscriptionTier", "weeklyPostCount", "lastWeekReset")
      VALUES 
        ('${id}', 'testbuyer@test.com', '${pw}', 'Test Buyer', 'buyer', true, NOW(), NOW(), 'free', 0, NOW())
      ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, "isActive" = true
    `);
    console.log("Buyer upserted with email: testbuyer@test.com, password: Test@1234, id:", id);
  } catch(e) {
    console.error("Insert failed:", e.message);
    // Try to get existing
    const [existing] = await sequelize.query(`SELECT id FROM "Users" WHERE email = 'testbuyer@test.com'`);
    if (existing.length > 0) {
      console.log("Already exists, resetting password...");
      const newPw = await bcrypt.hash("Test@1234", 10);
      await sequelize.query(`UPDATE "Users" SET password = '${newPw}', "isActive" = true WHERE email = 'testbuyer@test.com'`);
      console.log("Password reset done");
    }
  }
  
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
