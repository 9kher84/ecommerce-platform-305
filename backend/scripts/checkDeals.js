const { sequelize } = require("../sequelize_setup");

async function checkDeals() {
  try {
    const [results] = await sequelize.query('SELECT COUNT(*) FROM "Deals"');
    console.log("Deals (capitalized) count:", results[0].count);

    const [results2] = await sequelize.query("SELECT COUNT(*) FROM deals");
    console.log("deals (lowercase) count:", results2[0].count);

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

checkDeals();
