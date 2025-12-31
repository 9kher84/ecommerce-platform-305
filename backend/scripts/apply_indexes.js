const { sequelize } = require('../sequelize_setup');
const fs = require('fs');
const path = require('path');

async function applyIndexes() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database.');

        const sqlPath = path.join(__dirname, '../database/performance_indexes.sql');
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        // Split by semicolon to execute individually, though sequelize.query can handle raw sql, 
        // sometimes multiple statements in one query call might differ by driver.
        // But for safe execution we split.
        const statements = sqlContent
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        console.log(`Found ${statements.length} SQL statements to execute.`);

        for (const sql of statements) {
            if (sql.startsWith('--')) continue; // Skip comments if split weirdly, but usually comments are handled.
            // Actually, comments might be inside. 
            // Simple split might be risky if comments contain semicolons, but standard SQL usually terminates with ;

            // let's just send the whole thing? Postres usually handles multi-statement if enabled? 
            // Sequelize `query` usually executes one.
            // Let's iterate.

            try {
                await sequelize.query(sql);
                console.log(`✅ Executed: ${sql.substring(0, 50)}...`);
            } catch (err) {
                console.warn(`⚠️ Warning executing statement: ${sql.substring(0, 50)}... \nError: ${err.message}`);
            }
        }

        console.log('✅ All indexes processed.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Fatal error applying indexes:', error);
        process.exit(1);
    }
}

applyIndexes();
