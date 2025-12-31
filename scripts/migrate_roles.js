const fs = require('fs');
const path = require('path');
const { sequelize, User, Role, UserRole, City, Region, UserContext, Sequelize } = require('../backend/sequelize_setup');
const { Op } = Sequelize;

async function migrateRoles() {
    console.log('🚀 INITIALIZING LIVE ROLE & CONTEXT MIGRATION...');
    console.log('⚠️  This will WRITE to the database.');

    // Safety Delay
    await new Promise(r => setTimeout(r, 2000));

    const transaction = await sequelize.transaction();

    try {
        // 1. SETUP: Load Maps
        console.log('📚 Loading Source Data Maps...');

        // Role Map
        const roles = await Role.findAll({ transaction });
        const roleMap = {};
        roles.forEach(r => roleMap[r.name] = r.id);

        // City Map (for Context)
        // STRICT: Aliasing as 'region' because that is how the association is defined
        const cities = await City.findAll({
            include: [{ model: Region, as: 'region' }],
            transaction
        });
        const cityMap = new Map();
        cities.forEach(c => {
            cityMap.set(c.name.trim().toLowerCase(), c);
            if (c.name_ar) cityMap.set(c.name_ar.trim(), c);
        });

        // 2. FETCH USERS
        // Only migrate users who have a role but DO NOT have an entry in UserRoles yet (partial restart safety)
        // Actually, for simplicity/idempotency, we can check existence or use findOrCreate.
        const users = await User.findAll({
            attributes: ['id', 'email', 'role', 'city'],
            where: { role: { [Op.not]: null } },
            transaction
        });

        console.log(`👥 Processing ${users.length} users...`);

        const stats = {
            rolesAssigned: 0,
            contextsAssigned: 0,
            contextRestricted: 0,
            errors: 0
        };

        for (const user of users) {
            // --- Part A: Role Migration ---
            const targetRoleId = roleMap[user.role];
            if (targetRoleId) {
                // Idempotent assignment
                const [ur, urCreated] = await UserRole.findOrCreate({
                    where: { userId: user.id, roleId: targetRoleId },
                    transaction
                });
                if (urCreated) stats.rolesAssigned++;
            } else {
                console.warn(`⚠️  User ${user.email}: Target Role '${user.role}' not found. Skipping Role.`);
                stats.errors++;
            }

            // --- Part B: Context Migration ---
            // "Context Enforcement Rule": Users without context are restricted (i.e., No UserContext created).
            if (user.city) {
                const targetCity = cityMap.get(user.city.trim().toLowerCase());
                if (targetCity) {
                    const [uc, ucCreated] = await UserContext.findOrCreate({
                        where: { userId: user.id },
                        defaults: {
                            cityId: targetCity.id,
                            regionId: targetCity.region.id,
                            // teamId: null (Future)
                        },
                        transaction
                    });
                    // If it existed, we might want to update it? For now, assume fresh migration or preserve existing.
                    if (ucCreated) stats.contextsAssigned++;
                } else {
                    // Context Restricted (Logged)
                    stats.contextRestricted++;
                    // console.log(`   User ${user.email} -> Context Restricted (Invalid City: ${user.city})`);
                }
            } else {
                // Context Restricted (No City)
                stats.contextRestricted++;
            }
        }

        await transaction.commit();
        console.log('✅ MIGRATION COMPLETE & COMMITTED.');
        console.log('📊 Stats:');
        console.log(`   - Roles Assigned: ${stats.rolesAssigned}`);
        console.log(`   - Contexts Assigned: ${stats.contextsAssigned}`);
        console.log(`   - Context Restricted Users: ${stats.contextRestricted} (Intentional per Approval)`);
        console.log(`   - Errors (Missing Roles): ${stats.errors}`);

        process.exit(0);

    } catch (error) {
        await transaction.rollback();
        console.error('❌ MIGRATION FAILED (Rolled Back):', error);
        process.exit(1);
    }
}

migrateRoles();
