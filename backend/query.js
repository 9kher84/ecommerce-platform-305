const { sequelize } = require("./sequelize_setup");
async function check() {
  try {
    const [results] = await sequelize.query("SELECT id, role FROM users LIMIT 5;");
    console.log("Users:", results);
    const [tables] = await sequelize.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public';");
    console.log("Tables:", tables.map(t => t.table_name).join(", "));
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
check();
