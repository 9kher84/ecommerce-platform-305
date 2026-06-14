const { User, sequelize } = require('../sequelize_setup');
const bcrypt = require('bcrypt');

async function run() {
  try {
    const user = await User.findOne({
      where: { email: 'seller1@test.com' },
      attributes: ['id', 'email', 'password']
    });

    if (user) {
      console.log('--- USER DATA ---');
      console.log('HASH PREFIX:', user.password.substring(0,10));
      console.log('HASH SUFFIX:', user.password.substring(user.password.length - 10));
      console.log('FULL HASH:', user.password);
    } else {
      console.log('USER NOT FOUND IN DB');
    }

    console.log('\n--- RAW SQL QUERY ---');
    const [results] = await sequelize.query(`SELECT id, email, password FROM "Users" WHERE email='seller1@test.com';`);
    console.log(results);

    console.log('\n--- NEW HASH FOR 123456 ---');
    const newHash = await bcrypt.hash('123456', 10);
    console.log(newHash);

  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

run();
