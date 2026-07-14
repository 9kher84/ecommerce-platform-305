const { sequelize } = require('./sequelize_setup'); 
sequelize.query('ALTER TABLE "PurchaseRequests" ALTER COLUMN "sectorId" DROP NOT NULL')
.then(() => console.log('Done'))
.catch(console.error)
.finally(() => process.exit(0));
