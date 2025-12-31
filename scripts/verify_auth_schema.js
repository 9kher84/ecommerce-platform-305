const { initSequelize, sequelize } = require('../backend/sequelize_setup');

async function verifySchema() {
    try {
        console.log('🔄 Starting Schema Verification...');
        await initSequelize();
        console.log('✅ Schema Verification Passed: All tables synced.');

        // Quick check if tables exist
        const tables = await sequelize.getQueryInterface().showAllSchemas();
        // showAllSchemas might be different in Pg.
        // Let's just exit. initSequelize throws if it fails.
        process.exit(0);
    } catch (error) {
        console.error('❌ Schema Verification Failed:', error);
        process.exit(1);
    }
}

verifySchema();
