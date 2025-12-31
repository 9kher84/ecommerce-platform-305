const { sequelize } = require('../sequelize_setup');

async function listTables() {
    try {
        const [results] = await sequelize.query(`
            SELECT tablename 
            FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY tablename;
        `);
        console.log('Tables:', results.map(r => r.tablename));
    } catch (error) {
        console.error(error);
    } finally {
        await sequelize.close();
    }
}

listTables();
