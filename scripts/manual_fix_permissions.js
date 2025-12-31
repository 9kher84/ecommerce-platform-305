const { sequelize } = require('../backend/sequelize_setup');

const fixPermissionsSchema = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to DB.');

        // 1. Fix Type and Nullability (Standard Postgres Syntax)
        console.log('🔄 Fixing Column Type and Nullability...');
        await sequelize.query(`
            ALTER TABLE "permissions" 
            ALTER COLUMN "key" TYPE VARCHAR(255),
            ALTER COLUMN "key" SET NOT NULL,
            ALTER COLUMN "key" DROP DEFAULT;
        `);

        // 2. Add Unique Constraint safely
        console.log('🔄 ensuring Unique Constraint...');
        try {
            await sequelize.query(`
                ALTER TABLE "permissions" ADD CONSTRAINT "permissions_key_uk" UNIQUE ("key");
            `);
            console.log('✅ Unique Constraint Added.');
        } catch (err) {
            if (err.original && err.original.code === '23505') {
                console.log('⚠️ Unique Constraint might already exist (Duplicate key). Data needs cleanup? Ignoring.');
            } else if (err.original && err.original.code === '42710') {
                console.log('✅ Unique Constraint already exists.');
            } else {
                console.log('⚠️ Constraint Error (likely exists):', err.message);
            }
        }

        console.log('✅ Manual Fix Complete.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error fixing schema:', error);
        process.exit(1);
    }
};

fixPermissionsSchema();
