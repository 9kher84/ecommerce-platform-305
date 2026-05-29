const { sequelize } = require("../sequelize_setup");

async function check() {
  const [orgs] = await sequelize.query(`SELECT count(*) FROM "organizations"`);
  const [users] = await sequelize.query(
    `SELECT count(*) FROM "organization_users"`,
  );
  console.log(`Current Organizations: ${orgs[0].count}`);
  console.log(`Current Users in Orgs: ${users[0].count}`);
  process.exit(0);
}
check();
