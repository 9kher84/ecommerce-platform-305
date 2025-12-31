require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { initSequelize, User } = require('../sequelize_setup');
const bcrypt = require('bcryptjs');

async function reveal() {
    await initSequelize();

    const ownerId = process.env.OWNER_ID;
    console.log('\n🕵️ REVEALING SOVEREIGN IDENTITY...');
    console.log(`🔑 Configured OWNER_ID: ${ownerId || 'UNDEFINED'}`);

    if (!ownerId) {
        console.error('❌ OWNER_ID is not set in .env! You must set this to a UUID to enable Sovereign Mode.');
        process.exit(1);
    }

    let user = await User.findByPk(ownerId);
    const pwd = 'Sovereign@2025';
    const hashed = await bcrypt.hash(pwd, 10);

    if (user) {
        console.log(`👤 Owner User Found: ${user.email}`);
        user.password = hashed;
        user.role = 'admin'; // Ensure they have admin capabilities at least
        await user.save();
        console.log('✅ Password Reset to: ' + pwd);
    } else {
        console.log('⚠️ Owner User NOT found in DB. Creating...');
        try {
            user = await User.create({
                id: ownerId,
                name: 'Sovereign Owner',
                email: 'owner@sovereign.net',
                password: pwd,
                role: 'admin', // Starting with admin, Identity check will upgrade privileges
                isActive: true
            });
            console.log('✅ Owner Created!');
            console.log(`📧 Email: owner@sovereign.net`);
            console.log(`🔑 Password: ${pwd}`);
        } catch (e) {
            console.error('❌ Creation Failed:', e.message);
        }
    }
    process.exit(0);
}

reveal();
