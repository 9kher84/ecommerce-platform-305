require('dotenv').config();
const { sequelize, User } = require('../sequelize_setup');
User.findOne({ where: { email: 'buyer1@testdata.com' }, attributes: ['id', 'email', 'password'] })
  .then(u => { console.log('result:', u ? u.email : 'NOT FOUND'); process.exit(); })
  .catch(e => { console.error('ERROR:', e.message); process.exit(); });
