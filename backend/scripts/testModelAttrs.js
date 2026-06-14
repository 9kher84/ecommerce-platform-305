require('dotenv').config();
const { User } = require('../sequelize_setup');
const attrs = Object.keys(User.rawAttributes);
console.log('Model attributes:', attrs.join(', '));
process.exit();
