const { sequelize } = require('../sequelize_setup');

sequelize.query("SELECT email, password, \"isActive\" FROM users WHERE email = 'buyer1@testdata.com'")
  .then(([rows]) => { 
    console.log(JSON.stringify(rows, null, 2)); 
    process.exit(); 
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
