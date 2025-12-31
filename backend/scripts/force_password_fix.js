const { sequelize, User } = require('../sequelize_setup');
const bcrypt = require('bcrypt');

async function fixPasswords() {
    await sequelize.authenticate();

    // 1. Fix Admin
    const admin = await User.findOne({ where: { email: 'admin@test.com' } });
    if (admin) {
        // Force manual hash to be absolutely sure
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('Admin@123', salt);

        await sequelize.query(
            'UPDATE "Users" SET "password" = :hash WHERE "id" = :id',
            {
                replacements: { hash, id: admin.id },
                type: sequelize.QueryTypes.UPDATE
            }
        );
        console.log('✅ Admin password forcefully updated via RAW SQL.');

        // Verify immediately
        const verify = await User.findByPk(admin.id);
        const check = await bcrypt.compare('Admin@123', verify.password);
        console.log(`🔐 Admin Verification Check: ${check ? 'PASS' : 'FAIL'}`);
    } else {
        console.log('❌ Admin not found.');
    }

    // 2. Fix Owner
    const ownerId = process.env.OWNER_ID;
    if (ownerId) {
        const owner = await User.findByPk(ownerId);
        if (owner) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash('Sovereign@2025', salt);

            await sequelize.query(
                'UPDATE "Users" SET "password" = :hash WHERE "id" = :id',
                {
                    replacements: { hash, id: owner.id },
                    type: sequelize.QueryTypes.UPDATE
                }
            );
            console.log('✅ Owner password forcefully updated via RAW SQL.');

            const verify = await User.findByPk(owner.id);
            const check = await bcrypt.compare('Sovereign@2025', verify.password);
            console.log(`🔐 Owner Verification Check: ${check ? 'PASS' : 'FAIL'}`);
        }
    }

    process.exit(0);
}

fixPasswords();
