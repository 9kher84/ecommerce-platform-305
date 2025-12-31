const { sequelize } = require('../sequelize_setup');
const migration = require('../migrations/20251206001-fix-acceptedat-field.js');

async function executeMigration() {
    console.log('=== SOVEREIGN MIGRATION EXECUTION ===');
    console.log('Started at:', new Date().toISOString());

    const queryInterface = sequelize.getQueryInterface();

    try {
        console.log('\n1. RUNNING MIGRATION UP...');
        await migration.up(queryInterface, sequelize.Sequelize);

        console.log('\n2. VERIFICATION QUERY...');
        const [results] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'PriceQuotes' 
      AND column_name = 'acceptedAt'
    `);

        console.log('Verification results:', results);

        if (results.length === 0) {
            throw new Error('❌ SOVEREIGN FAILURE: acceptedAt column not found after migration');
        }

        console.log('\n✅ SOVEREIGN MIGRATION COMPLETED SUCCESSFULLY');

    } catch (error) {
        console.error('\n❌ SOVEREIGN MIGRATION FAILED:', error.message);

        console.log('\n3. ATTEMPTING ROLLBACK...');
        try {
            await migration.down(queryInterface, sequelize.Sequelize);
            console.log('✅ Rollback completed');
        } catch (rollbackError) {
            console.error('❌ Rollback failed:', rollbackError.message);
        }

        throw error;
    }
}

executeMigration().catch(process.exit.bind(process, 1));
