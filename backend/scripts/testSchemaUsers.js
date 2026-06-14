require('dotenv').config();
const { sequelize } = require('../sequelize_setup');
sequelize.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position")
  .then(([rows]) => { 
    console.log(rows.map(r => r.column_name).join(', ')); 
    process.exit(); 
  })
  .catch(e => { 
    console.error(e.message); 
    process.exit(); 
  });
