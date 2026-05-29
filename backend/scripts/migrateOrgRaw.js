const { sequelize } = require("../sequelize_setup");
const { v4: uuidv4 } = require("uuid");

async function migrate() {
  try {
    console.log("Running raw SQL migrations...");

    // 1. Create organizations table
    await sequelize.query(`
            CREATE TABLE IF NOT EXISTS "organizations" (
                "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                "name" VARCHAR(255) NOT NULL,
                "commercial_registration" VARCHAR(255),
                "vat_number" VARCHAR(255),
                "subscription_plan" VARCHAR(255) DEFAULT 'free',
                "status" VARCHAR(255) DEFAULT 'active',
                "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

    // 2. Create organization_users table (using Users PascalCase)
    await sequelize.query(`
            DROP TABLE IF EXISTS "organization_users" CASCADE;
            CREATE TABLE "organization_users" (
                "organization_id" UUID REFERENCES "organizations" ("id"),
                "user_id" UUID REFERENCES "Users" ("id"),
                "title" VARCHAR(255),
                "role" VARCHAR(255),
                "is_primary" BOOLEAN DEFAULT false,
                "status" VARCHAR(255) DEFAULT 'active',
                "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY ("organization_id", "user_id")
            );
        `);

    // 3. Create audit_logs table
    await sequelize.query(`
            DROP TABLE IF EXISTS "audit_logs" CASCADE;
            CREATE TABLE "audit_logs" (
                "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                "user_id" UUID REFERENCES "Users" ("id"),
                "organization_id" UUID REFERENCES "organizations" ("id"),
                "action" VARCHAR(255) NOT NULL,
                "entity_type" VARCHAR(255),
                "entity_id" UUID,
                "old_data" JSONB,
                "new_data" JSONB,
                "ip_address" VARCHAR(255),
                "user_agent" TEXT,
                "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);

    // 4. Add columns
    const queries = [
      `ALTER TABLE "PurchaseRequests" ADD COLUMN IF NOT EXISTS "organization_id" UUID REFERENCES "organizations" ("id");`,
      `ALTER TABLE "PurchaseRequests" ADD COLUMN IF NOT EXISTS "approval_status" VARCHAR(255) DEFAULT 'none';`,
      `ALTER TABLE "PurchaseRequests" ADD COLUMN IF NOT EXISTS "approved_by" UUID REFERENCES "Users" ("id");`,
      `ALTER TABLE "PurchaseRequests" ADD COLUMN IF NOT EXISTS "approved_at" TIMESTAMP WITH TIME ZONE;`,
      `ALTER TABLE "PriceQuotes" ADD COLUMN IF NOT EXISTS "organization_id" UUID REFERENCES "organizations" ("id");`,
      `ALTER TABLE "deals" ADD COLUMN IF NOT EXISTS "organization_id" UUID REFERENCES "organizations" ("id");`,
    ];

    for (const q of queries) {
      try {
        await sequelize.query(q);
      } catch (err) {
        console.log(`Query failed (might be already applied): ${err.message}`);
      }
    }

    console.log("Creating Default Organization and assigning users...");
    const [orgs] = await sequelize.query(
      `SELECT id FROM "organizations" WHERE "name" = 'Default Organization'`,
    );
    let defaultOrgId;
    let orgsCreated = 0;
    if (orgs.length === 0) {
      defaultOrgId = uuidv4();
      await sequelize.query(`
                INSERT INTO "organizations" ("id", "name", "subscription_plan", "status") 
                VALUES ('${defaultOrgId}', 'Default Organization', 'free', 'active');
            `);
      orgsCreated = 1;
    } else {
      defaultOrgId = orgs[0].id;
    }

    const [users] = await sequelize.query(`SELECT id, role FROM "Users"`);
    console.log(`Found ${users.length} users in 'Users' table.`);
    let usersAssigned = 0;
    for (const user of users) {
      try {
        await sequelize.query(`
                    INSERT INTO "organization_users" ("organization_id", "user_id", "title", "role", "is_primary")
                    VALUES ('${defaultOrgId}', '${user.id}', 'Member', '${user.role}', true)
                    ON CONFLICT ("organization_id", "user_id") DO NOTHING;
                `);
        usersAssigned++;
      } catch (e) {
        console.error(`Failed to assign user ${user.id}:`, e.message);
      }
    }

    console.log(`Migration complete.`);
    console.log(`Organizations Created: ${orgsCreated}`);
    console.log(`Users Assigned: ${usersAssigned}`);
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrate();
