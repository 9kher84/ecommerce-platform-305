require('dotenv').config();
const { sequelize, User } = require('../sequelize_setup');
async function test() {
  const user = await User.findOne({ where: { email: 'buyer1@testdata.com' }, attributes: { include: ['password'] } });
  console.log('found:', !!user);
  console.log('password field:', user?.password ? 'EXISTS' : 'EMPTY/NULL');
  console.log('password length:', user?.password?.length);
  const match = await user?.comparePassword('Test@12345');
  console.log('comparePassword result:', match);
  process.exit();
}
test().catch(e => { console.error(e.message); process.exit(); });
