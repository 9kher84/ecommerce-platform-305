const { sequelize } = require('./models');
sequelize.query('ALTER TYPE "enum_Awards_status" ADD VALUE IF NOT EXISTS \'completed\';')
  .then(() => {
    console.log('Enum updated');
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
