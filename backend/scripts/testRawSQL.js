require('dotenv').config();
process.env.NODE_ENV = 'test';
const { sequelize } = require('../sequelize_setup');
sequelize.query("SELECT email FROM users WHERE email = 'buyer1@testdata.com'")
  .then(([rows]) => { 
    console.log('RAW SQL result:', JSON.stringify(rows)); 
    process.exit(); 
  })
  .catch(e => { 
    console.error('ERROR:', e.message); 
    process.exit(); 
  });
