const { sequelize } = require("./sequelize_setup");

async function run() {
  await sequelize.authenticate();
  await sequelize.query(
    `UPDATE users SET "weeklyPostCount" = 0, "lastWeekReset" = NOW() WHERE email = 'testbuyer@test.com'`
  );
  const [r] = await sequelize.query(
    `SELECT email, "weeklyPostCount", "lastWeekReset" FROM users WHERE email = 'testbuyer@test.com'`
  );
  console.log("After reset:", r[0]);
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
