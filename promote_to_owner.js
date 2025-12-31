const { sequelize, User } = require('./backend/sequelize_setup');
const dotenv = require('dotenv');
dotenv.config();

const emailToPromote = process.argv[2]; // Get email from command line arg

if (!emailToPromote) {
    console.log('Usage: node promote_to_owner.js <email>');
    process.exit(1);
}

const promote = async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB');

        const user = await User.findOne({ where: { email: emailToPromote } });

        if (!user) {
            console.error('User not found!');
            process.exit(1);
        }

        console.log(`Found user: ${user.name} (${user.id})`);

        user.isAdmin = true;
        user.role = 'super_admin'; // or 'owner' if you have that enum
        user.adminPermissions = { fullAccess: true, everything: true };
        user.adminStatus = 'active';

        // IMPORTANT: In a real scenario, you update .env with this ID too
        console.log(`\n⚠️  PLEASE ADD THIS TO YOUR .env FILE:\nOWNER_ID=${user.id}\n`);

        await user.save();

        console.log('✅ User promoted to Super Admin successfully!');

    } catch (e) {
        console.error(e);
    } finally {
        await sequelize.close();
    }
};

promote();
