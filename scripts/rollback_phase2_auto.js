const { sequelize, UserRole, UserContext } = require('../backend/sequelize_setup');

async function automatedRollback() {
    console.log('🛑 INITIATING AUTOMATED ROLLBACK (PHASE 2)...');
    console.log('⚠️  This will WIPE all Authorization Assignments (UserRoles) and Contexts (UserContext).');

    // Safety Delay
    console.log('...Waiting 3 seconds. Press Ctrl+C to abort.');
    await new Promise(r => setTimeout(r, 3000));

    try {
        await sequelize.authenticate();

        // 1. Truncate Tables
        console.log('🗑️  Truncating "UserContext"...');
        await sequelize.query('TRUNCATE TABLE "UserContexts" RESTART IDENTITY CASCADE;'); // Note: Sequelize usually pluralizes table names in DB

        console.log('🗑️  Truncating "UserRoles"...');
        await sequelize.query('TRUNCATE TABLE "UserRoles" RESTART IDENTITY CASCADE;');

        // 2. Verification
        const rolesCount = await UserRole.count();
        const contextCount = await UserContext.count();

        if (rolesCount === 0 && contextCount === 0) {
            console.log('✅ Rollback Successful. System returned to Pre-Migration State.');
            process.exit(0);
        } else {
            console.error(`❌ Rollback Incomplete! Found ${rolesCount} roles and ${contextCount} contexts.`);
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Rollback Failed:', error);
        // Fallback for specific table name error
        if (error.message.includes('relation "UserContexts" does not exist')) {
            console.error('💡 Hint: Check table names in DB (UserContext vs UserContexts).');
        }
        process.exit(1);
    }
}

automatedRollback();
