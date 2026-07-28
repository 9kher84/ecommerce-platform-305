const { sequelize } = require('./sequelize_setup');
sequelize.query('SELECT * FROM "Roles"').then(res => {
  console.log(res[0]);
  process.exit(0);
});
