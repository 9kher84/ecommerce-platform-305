const { sequelize } = require("../sequelize_setup");

async function check() {
  await sequelize.authenticate();
  const [res] = await sequelize.query(`SELECT count(*) FROM "users"`);
  console.log('Total users:', res[0].count);
  const [seeded] = await sequelize.query(`SELECT count(*) FROM "users" WHERE name LIKE 'Load User %'`);
  console.log('Seeded users:', seeded[0].count);
  process.exit(0);
}
check();
