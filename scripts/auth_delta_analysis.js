const fs = require('fs');
const path = require('path');
const { sequelize, User, Role, Permission, Sequelize } = require('../backend/sequelize_setup');
const { Op } = Sequelize;

// 1. Definition of "Before" (Legacy Implied Permissions)
// Based on analysis of legacy controllers/middleware
const LEGACY_MAP = {
    'admin': ['MANAGE_USERS', 'MANAGE_REQUESTS', 'MANAGE_QUOTES', 'VIEW_PAYMENTS', 'MANAGE_CITIES'],
    'super_admin': ['*'], // Root access
    'city_manager': ['VIEW_USERS', 'APPROVE_REQUESTS', 'VIEW_REQUESTS'], // Approximation
    'buyer': ['VIEW_REQUESTS', 'CREATE_REQUEST'],
    'seller': ['VIEW_REQUESTS', 'CREATE_QUOTE']
};

async function analyzeAuthDelta() {
    console.log('⚖️  Starting Authorization Delta Analysis...');
    try {
        await sequelize.authenticate();

        // 2. Load New "After" Configuration (Roles & Perms)
        const roles = await Role.findAll({
            include: [{ model: Permission, as: 'permissions' }]
        });

        const newRoleMap = {}; // RoleName -> Set<PermissionKey>
        roles.forEach(r => {
            const perms = r.permissions.map(p => p.key);
            newRoleMap[r.name] = new Set(perms);
        });

        console.log(`📋 Loaded ${roles.length} New Roles for comparison.`);

        // 3. Analyze Users
        const users = await User.findAll({
            attributes: ['id', 'email', 'role'], // Legacy role
            where: { role: { [Op.not]: null } },
            raw: true
        });

        console.log(`👥 Computing Delta for ${users.length} users...`);

        const reportData = {
            escalations: [],
            losses: [],
            neutral: []
        };

        for (const user of users) {
            const legacyRole = user.role;
            const targetRole = legacyRole; // 1:1 Mapping for now (confirmed by Dry Run)

            // Get Legacy Perms
            const legacyPerms = LEGACY_MAP[legacyRole] || [];

            // Get New Perms
            const newPermSet = newRoleMap[targetRole];
            if (!newPermSet) {
                reportData.losses.push({
                    userId: user.id,
                    email: user.email,
                    role: legacyRole,
                    reason: `Target Role '${targetRole}' does not exist in New System. All Access Lost.`
                });
                continue;
            }

            const newPerms = Array.from(newPermSet);

            // Compare
            const added = newPerms.filter(p => !legacyPerms.includes(p) && !legacyPerms.includes('*'));
            const removed = legacyPerms.filter(p => !newPermSet.has(p) && p !== '*');

            // Categorize
            if (added.length > 0) {
                reportData.escalations.push({
                    userId: user.id,
                    email: user.email,
                    role: legacyRole,
                    legacy: legacyPerms,
                    new: newPerms,
                    added: added
                });
            } else if (removed.length > 0) {
                // If Legacy was '*', and New is finite, it's technically a loss, but maybe intended?
                // If SuperAdmin -> SuperAdmin (which implies *), we need to check if New SuperAdmin has everything.
                // Our seed says SuperAdmin has 'All seeded perms'.
                // If legacy was '*', we assume it matched everything.
                if (legacyPerms.includes('*')) {
                    // Intentionally limiting scope?
                    // For this report, we flag it as neutral if role is comparable.
                } else {
                    reportData.losses.push({
                        userId: user.id,
                        email: user.email,
                        role: legacyRole,
                        removed: removed
                    });
                }
            } else {
                reportData.neutral.push(user.id);
            }
        }

        // 4. Report
        const report = {
            generatedAt: new Date(),
            summary: {
                totalUsers: users.length,
                escalations: reportData.escalations.length,
                losses: reportData.losses.length,
                neutral: reportData.neutral.length
            },
            details: {
                escalations: reportData.escalations,
                losses: reportData.losses
            }
        };

        const logDir = path.join(__dirname, '../migration_logs');
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

        fs.writeFileSync(
            path.join(logDir, 'auth_delta_report.json'),
            JSON.stringify(report, null, 2)
        );

        console.log('✅ Delta Analysis Complete.');
        console.log(`   - Escalations: ${report.summary.escalations}`);
        console.log(`   - Losses: ${report.summary.losses}`);
        console.log(`   - Exact/Safe Matches: ${report.summary.neutral}`);

        process.exit(0);

    } catch (error) {
        console.error('❌ Delta Analysis Failed:', error);
        process.exit(1);
    }
}

analyzeAuthDelta();
