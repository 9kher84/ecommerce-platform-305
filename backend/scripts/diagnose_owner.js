const { sequelize, User } = require('../sequelize_setup');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

async function diagnoseOwner() {
    await sequelize.authenticate();

    const ownerId = process.env.OWNER_ID;
    console.log(`🔍 DIAGNOSING OWNER: ${ownerId}`);

    // 1. Check by ID
    const byId = await User.findByPk(ownerId);
    if (byId) {
        console.log(`✅ Found by ID: ${byId.email}`);
        console.log(`   Is Active: ${byId.isActive}`);
        console.log(`   Role: ${byId.role}`);
        console.log(`   Hash Length: ${byId.password.length}`);
    } else {
        console.log('❌ NOT FOUND BY ID');
    }

    // 2. Check by Email 'owner@sovereign.net'
    const byEmailNet = await User.findOne({ where: { email: 'owner@sovereign.net' } });
    if (byEmailNet) {
        console.log(`✅ Found by Email (net): ${byEmailNet.id}`);
    } else {
        console.log('❌ NOT FOUND BY EMAIL (sovereign.net)');
    }

    // 3. Check by Email 'owner@platform.internal'
    const byEmailInternal = await User.findOne({ where: { email: 'owner@platform.internal' } });
    if (byEmailInternal) {
        console.log(`✅ Found by Email (internal): ${byEmailInternal.id}`);
    } else {
        console.log('❌ NOT FOUND BY EMAIL (platform.internal)');
    }

    // 4. List all users to see what's actually there
    const allUsers = await User.findAll({ attributes: ['id', 'email', 'role'] });
    console.log('\n👥 ALL USERS IN DB:');
    allUsers.forEach(u => console.log(`   - ${u.email} [${u.role}] (${u.id})`));

    process.exit(0);
}

diagnoseOwner();
