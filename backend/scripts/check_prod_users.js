const { Sequelize } = require('sequelize');

async function checkProdUsers() {
  const sequelize = new Sequelize('postgresql://neondb_owner:npg_hudwpP4y8bvU@ep-rapid-river-ap7l6xha-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require', {
    dialect: 'postgres',
    logging: false
  });

  try {
    await sequelize.authenticate();
    
    const [lowerUsers] = await sequelize.query(`SELECT email FROM users WHERE email LIKE '%buyer1%'`);
    console.log("Users in lowercase 'users':", lowerUsers);

    const [upperUsers] = await sequelize.query(`SELECT email FROM "Users" WHERE email LIKE '%buyer1%'`);
    console.log("Users in uppercase 'Users':", upperUsers);
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Fatal Error:", err.message);
    process.exit(1);
  }
}

checkProdUsers();
