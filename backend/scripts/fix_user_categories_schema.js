const { sequelize } = require("../sequelize_setup");

async function fixSchema() {
  try {
    console.log("🛠 Starting Advanced Schema Correction for UserCategories...");

    // 1. Drop existing primary key if it exists
    // In PostgreSQL, the PK is usually named "UserCategories_pkey"
    await sequelize.query(`
            DO $$ 
            BEGIN 
                IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
                           WHERE table_name='UserCategories' AND constraint_type='PRIMARY KEY') THEN
                    ALTER TABLE "UserCategories" DROP CONSTRAINT IF EXISTS "UserCategories_pkey";
                END IF;
            END $$;
        `);

    // 2. Add ID column if it doesn't exist
    await sequelize.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                               WHERE table_name='UserCategories' AND column_name='id') THEN
                    ALTER TABLE "UserCategories" ADD COLUMN "id" SERIAL PRIMARY KEY;
                ELSE
                    -- If column exists but isn't PK, make it PK (Edge case)
                    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                                   WHERE table_name='UserCategories' AND constraint_type='PRIMARY KEY') THEN
                        ALTER TABLE "UserCategories" ADD PRIMARY KEY (id);
                    END IF;
                END IF;
            END $$;
        `);

    console.log("✅ Advanced Schema Correction Applied Successfully.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Advanced Schema Correction Failed:", error);
    process.exit(1);
  }
}

fixSchema();
