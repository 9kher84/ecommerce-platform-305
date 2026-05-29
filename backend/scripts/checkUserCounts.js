const { sequelize } = require("../sequelize_setup");

async function check() {
  try {
    const [u1] = await sequelize.query('SELECT count(*) FROM "users"');
    console.log(`users (snake): ${u1[0].count}`);
  } catch (e) {
    console.log("users table not found");
  }

  try {
    const [u2] = await sequelize.query('SELECT count(*) FROM "Users"');
    console.log(`Users (Pascal): ${u2[0].count}`);
  } catch (e) {
    console.log("Users table not found");
  }

  process.exit(0);
}
check();
