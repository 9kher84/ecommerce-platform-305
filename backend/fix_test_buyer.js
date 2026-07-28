const { sequelize } = require("./sequelize_setup");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

async function run() {
  await sequelize.authenticate();
  
  // Check lowercase users table
  const [cnt] = await sequelize.query('SELECT COUNT(*) as cnt FROM users');
  console.log("lowercase users table count:", cnt[0].cnt);
  
  // Check if testbuyer exists in lowercase table
  const [existing] = await sequelize.query("SELECT id, email, role FROM users WHERE email = 'testbuyer@test.com'");
  console.log("Existing in lowercase users:", existing);
  
  if (existing.length > 0) {
    // Reset password in the correct table
    const pw = await bcrypt.hash("Test@1234", 10);
    await sequelize.query(`UPDATE users SET password = '${pw}', "isActive" = true WHERE email = 'testbuyer@test.com'`);
    console.log("Password reset in lowercase users table");
  } else {
    // Insert in correct table
    const pw = await bcrypt.hash("Test@1234", 10);
    const id = uuidv4();
    try {
      await sequelize.query(`
        INSERT INTO users (id, email, password, name, role, "isActive", "createdAt", "updatedAt", "subscriptionTier", "weeklyPostCount", "lastWeekReset")
        VALUES ('${id}', 'testbuyer@test.com', '${pw}', 'Test Buyer', 'buyer', true, NOW(), NOW(), 'free', 0, NOW())
      `);
      console.log("Inserted testbuyer into lowercase users table with id:", id);
    } catch(e) {
      console.error("Insert error:", e.message);
    }
  }
  
  // Verify with Sequelize model
  const { User } = require("./sequelize_setup");
  const user = await User.findOne({ where: { email: 'testbuyer@test.com' }, attributes: { include: ['password'] } });
  console.log("Sequelize User.findOne result:", user ? { id: user.id, email: user.email, role: user.role } : null);
  
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
