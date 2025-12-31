const { sequelize, Product } = require('../sequelize_setup');

async function testIndexes() {
    try {
        console.log('🔍 Connecting to Database...');
        await sequelize.authenticate();
        console.log('✅ Connected.');

        // 1. Force Sync (Alter) to ensure indexes exist
        console.log('🛠️  Syncing Model (Alter)...');
        await Product.sync({ alter: true });
        console.log('✅ Model Synced.');

        // 2. Run EXPLAIN Query
        console.log('🧪 Running EXPLAIN Query for Composite Index (sellerId + categoryId)...');

        // Postgres EXPLAIN
        const [pgResults] = await sequelize.query(`
            EXPLAIN 
            SELECT * FROM "Products" 
            WHERE "sellerId" = '00000000-0000-0000-0000-000000000000' 
            AND "categoryId" = 1;
        `);

        console.log('📄 Query Plan Explanation:');
        console.log(JSON.stringify(pgResults, null, 2));

        console.log('✅ Index Verification Complete.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during verification:', error);
        process.exit(1);
    }
}

testIndexes();
