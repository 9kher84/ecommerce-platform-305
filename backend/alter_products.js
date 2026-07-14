const { sequelize } = require('./sequelize_setup'); 
sequelize.query('ALTER TABLE "Products" ADD COLUMN IF NOT EXISTS status VARCHAR(255) DEFAULT \'active\';')
.then(() => console.log('Done'))
.catch(console.error)
.finally(() => process.exit(0));
