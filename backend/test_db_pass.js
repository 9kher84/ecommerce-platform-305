const { Sequelize } = require("sequelize");

async function testConnection(user, password) {
  const sequelize = new Sequelize("postgres", user, password, {
    host: "localhost",
    dialect: "postgres",
    logging: false,
  });

  try {
    await sequelize.authenticate();
    console.log(
      `✅ SUCCESS: user=${user}, password=${password === "" ? "(empty)" : password}`,
    );
    return true;
  } catch (error) {
    console.log(
      `❌ FAIL: user=${user}, password=${password === "" ? "(empty)" : password} - ${error.message}`,
    );
    return false;
  } finally {
    await sequelize.close();
  }
}

async function run() {
  const passwords = ["", "postgres", "admin123", "root", "123456"];
  for (const p of passwords) {
    if (await testConnection("postgres", p)) break;
  }
}

run();
