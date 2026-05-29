const { sequelize } = require("../sequelize_setup");

async function checkUsers() {
  try {
    const [results] = await sequelize.query('SELECT COUNT(*) FROM "Users"');
    console.log("Users (capitalized) count:", results[0].count);

    const [results2] = await sequelize.query("SELECT COUNT(*) FROM users");
    console.log("users (lowercase) count:", results2[0].count);

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

checkUsers();
