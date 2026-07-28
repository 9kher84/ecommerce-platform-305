const { sequelize } = require("./sequelize_setup");
const bcrypt = require("bcrypt");

async function run() {
  await sequelize.authenticate();
  
  // Find buyer1@test.com in Users table
  const [rows] = await sequelize.query(
    `SELECT id, email, role, "isActive", password FROM "Users" WHERE email = 'buyer1@test.com' LIMIT 1`
  );
  
  if (rows.length === 0) {
    console.log("NOT FOUND in Users table. Checking lowercase users table...");
    const [rows2] = await sequelize.query(
      `SELECT id, email, role FROM users WHERE email = 'buyer1@test.com' LIMIT 1`
    );
    console.log("lowercase users:", rows2);
    process.exit(0);
  }
  
  const user = rows[0];
  console.log("Found:", { id: user.id, email: user.email, role: user.role, isActive: user.isActive });
  
  // Reset password
  const hashed = await bcrypt.hash("Test@1234", 10);
  await sequelize.query(
    `UPDATE "Users" SET password = '${hashed}' WHERE id = '${user.id}'`
  );
  console.log("Password reset to: Test@1234");
  
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
