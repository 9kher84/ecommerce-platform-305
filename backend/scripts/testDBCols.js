require('dotenv').config();
const { sequelize } = require('../sequelize_setup');
sequelize.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'")
  .then(([rows]) => { 
    console.log('DB columns:', rows.length); 
    console.log(rows.map(r=>r.column_name).join(', ')); 
    process.exit(); 
  })
  .catch(e => { 
    console.error(e.message); 
    process.exit(); 
  });
