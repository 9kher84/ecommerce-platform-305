const { sequelize } = require("./sequelize_setup");

async function run() {
  await sequelize.authenticate();
  
  const [cnt] = await sequelize.query('SELECT COUNT(*) as cnt FROM "Users"');
  console.log("Total Users:", cnt[0].cnt);
  
  const [tb] = await sequelize.query("SELECT id, email, role, \"isActive\" FROM \"Users\" WHERE email = 'testbuyer@test.com'");
  console.log("testbuyer@test.com:", tb);
  
  const [buyers] = await sequelize.query("SELECT id, email, role FROM \"Users\" WHERE role = 'buyer' LIMIT 3");
  console.log("Buyers sample:", buyers);
  
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
