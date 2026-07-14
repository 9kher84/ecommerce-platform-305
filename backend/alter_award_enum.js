const { sequelize } = require("./sequelize_setup");

async function run() {
  try {
    await sequelize.query(`ALTER TYPE "enum_Awards_status" ADD VALUE 'converted';`);
    console.log("Added converted to enum_Awards_status");
  } catch (err) {
    console.log(err.message);
  } finally {
    process.exit(0);
  }
}
run();
