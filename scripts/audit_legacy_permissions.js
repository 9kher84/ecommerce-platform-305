const fs = require('fs');
const path = require('path');
const { sequelize, User, Sequelize } = require('../backend/sequelize_setup');
const { Op } = Sequelize;

async function auditPermissions() {
    console.log('🔍 Auditing Legacy Permissions...');
    try {
        await sequelize.authenticate();

        // Find users with legacy adminPermissions
        const users = await User.findAll({
            attributes: ['id', 'name', 'email', 'role', 'adminPermissions'],
            where: {
                adminPermissions: {
                    [Op.ne]: null
                }
            },
            raw: true
        });

        console.log(`Found ${users.length} users with legacy permissions.`);

        const logDir = path.join(__dirname, '../migration_logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir);
        }

        const logFile = path.join(logDir, 'legacy_permissions_review.json');

        const report = {
            generatedAt: new Date(),
            count: users.length,
            users: users
        };

        fs.writeFileSync(logFile, JSON.stringify(report, null, 2));
        console.log(`✅ Audit complete. Report saved to: ${logFile}`);
        process.exit(0);
    } catch (error) {
        console.error('❌ Audit Failed:', error);
        process.exit(1);
    }
}

auditPermissions();
