const { sequelize, User, Role } = require('../sequelize_setup');

async function checkData() {
  try {
    await sequelize.authenticate();
    
    // Check User roles via the model
    const roles = User.getAttributes().role.values;
    console.log('--- Step 1: Defined User Roles in User Model ---');
    console.log(roles);
    
    // Check Roles from Role table if it exists
    try {
      const dbRoles = await Role.findAll({ attributes: ['name'] });
      console.log('--- Roles defined in the Role table ---');
      console.log(dbRoles.map(r => r.name));
    } catch (e) {
      console.log('Could not fetch from Role table or it is empty.', e.message);
    }
    
    console.log('\n--- Step 2: Existing Users ---');
    const users = await User.findAll({
      attributes: ['email', 'role', 'isActive'],
      paranoid: false,
      limit: 20
    });
    
    if (users.length === 0) {
      console.log('No users found in the database.');
    } else {
      console.table(users.map(u => u.toJSON()));
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkData();
