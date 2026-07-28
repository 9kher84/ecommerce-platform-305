const { sequelize } = require("./sequelize_setup");

async function run() {
  await sequelize.authenticate();
  
  // Check the user including deletedAt
  const [r] = await sequelize.query(`
    SELECT id, email, role, "isActive", "deletedAt" 
    FROM "Users" 
    WHERE email = 'testbuyer@test.com'
  `);
  console.log("User raw row:", r[0]);
  
  // Check if User model is paranoid
  const { User, Organization } = require("./sequelize_setup");
  console.log("User paranoid:", User.options.paranoid);
  console.log("Organization paranoid:", Organization.options.paranoid);
  
  // Try findOne exactly as authController does
  try {
    const user = await User.findOne({
      where: { email: 'testbuyer@test.com' },
      attributes: { include: ["password"] },
      include: [{ model: Organization, as: "organizations" }],
    });
    console.log("Sequelize findOne result (with org include):", user ? { id: user.id, email: user.email } : null);
  } catch(e) {
    console.error("findOne with org error:", e.message);
  }

  // Try without Organization include
  try {
    const user2 = await User.findOne({
      where: { email: 'testbuyer@test.com' },
      attributes: { include: ["password"] },
    });
    console.log("findOne WITHOUT org include:", user2 ? { id: user2.id, email: user2.email } : null);
  } catch(e) {
    console.error("findOne without org error:", e.message);
  }
  
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
