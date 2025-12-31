const fs = require('fs');
const path = require('path');
const { sequelize, User, Role, Sequelize } = require('../backend/sequelize_setup');
const { Op } = Sequelize;

async function dryRunMigration() {
    console.log('🔍 Starting Role Migration DRY RUN...');

    try {
        await sequelize.authenticate();

        // 1. Fetch Target Roles (Map Name -> UUID)
        const roles = await Role.findAll();
        const roleMap = {};
        roles.forEach(r => roleMap[r.name] = r.id);

        console.log('📋 Target Role Map:', roleMap);

        // 2. Fetch Users to Migrate
        // We only care about users who have a 'role' string but NO entry in UserRoles yet.
        // For Dry Run, we just grab everyone with a valid ENUM role.
        const users = await User.findAll({
            attributes: ['id', 'email', 'role'],
            where: {
                role: { [Op.not]: null }
            },
            raw: true
        });

        console.log(`📋 Analyzing ${users.length} users...`);

        const migrationPlan = [];
        const missingRoles = [];

        for (const user of users) {
            const legacyRole = user.role;
            const targetRoleId = roleMap[legacyRole];

            if (targetRoleId) {
                migrationPlan.push({
                    userId: user.id,
                    email: user.email,
                    legacyRole: legacyRole,
                    targetRoleId: targetRoleId,
                    action: 'MIGRATE'
                });
            } else {
                missingRoles.push({
                    userId: user.id,
                    email: user.email,
                    legacyRole: legacyRole,
                    error: 'Target Role Not Found in New Schema'
                });
            }
        }

        // 3. Generate Report
        const report = {
            generatedAt: new Date(),
            totalUsers: users.length,
            migratableCount: migrationPlan.length,
            errorCount: missingRoles.length,
            plan: migrationPlan,
            errors: missingRoles
        };

        const logDir = path.join(__dirname, '../migration_logs');
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

        const reportPath = path.join(logDir, 'role_migration_dry_run.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

        console.log(`✅ Dry Run Complete.`);
        console.log(`   - Migratable: ${migrationPlan.length}`);
        console.log(`   - Errors: ${missingRoles.length}`);
        console.log(`   - Report: ${reportPath}`);

        process.exit(0);

    } catch (error) {
        console.error('❌ Dry Run Failed:', error);
        process.exit(1);
    }
}

dryRunMigration();
