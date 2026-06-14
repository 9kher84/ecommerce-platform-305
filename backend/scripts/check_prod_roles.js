const { Sequelize } = require('sequelize');

async function checkRoles() {
  const sequelize = new Sequelize('postgresql://neondb_owner:npg_hudwpP4y8bvU@ep-rapid-river-ap7l6xha-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require', {
    dialect: 'postgres',
    logging: false
  });

  try {
    await sequelize.authenticate();
    
    const [roles] = await sequelize.query(`SELECT id, name FROM roles`);
    console.log("Roles table:", roles);

    const [perms] = await sequelize.query(`SELECT id, key FROM permissions LIMIT 5`);
    console.log("Permissions table:", perms);
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Fatal Error:", err.message);
    process.exit(1);
  }
}

checkRoles();
