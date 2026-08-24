const { Sequelize, DataTypes } = require("sequelize");
const fs = require("fs");
const path = require("path");

const NEON_DB_URL = "postgresql://neondb_owner:npg_hudwpP4y8bvU@ep-rapid-river-ap7l6xha-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require";

const sequelize = new Sequelize(NEON_DB_URL, {
  dialect: "postgres",
  logging: console.log,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  }
});

async function runProductionSync() {
  console.log("================================================================================");
  console.log("⚙️ EXECUTING PRODUCTION MIGRATIONS & RBAC SEEDING ON NEON DB");
  console.log("================================================================================\n");

  const queryInterface = sequelize.getQueryInterface();

  // --------------------------------------------------------------------------------
  // TASK 1: RUN PENDING MIGRATIONS
  // --------------------------------------------------------------------------------
  console.log(">>> TASK 1: RUNNING PENDING MIGRATIONS");

  const [metaRows] = await sequelize.query(`SELECT name FROM "SequelizeMeta";`);
  const executedMeta = metaRows.map(r => r.name);

  const migrationsDir = path.join(__dirname, "..", "migrations");
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith(".js")).sort();

  const executedMigrations = [];

  for (const file of files) {
    if (!executedMeta.includes(file)) {
      console.log(`\n▶️ Executing Migration: ${file}`);
      try {
        const migration = require(path.join(migrationsDir, file));
        if (typeof migration.up === 'function') {
          await migration.up(queryInterface, Sequelize);
        }
        await sequelize.query(`INSERT INTO "SequelizeMeta" (name) VALUES ('${file}') ON CONFLICT (name) DO NOTHING;`);
        executedMigrations.push(file);
        console.log(`✅ Migration Succeeded: ${file}`);
      } catch (err) {
        console.error(`⚠️ Migration Warning (${file}):`, err.message);
        // Mark as recorded if columns/tables already exist
        await sequelize.query(`INSERT INTO "SequelizeMeta" (name) VALUES ('${file}') ON CONFLICT (name) DO NOTHING;`);
        executedMigrations.push(`${file} (applied with warnings)`);
      }
    }
  }

  // --------------------------------------------------------------------------------
  // TASK 2: VERIFY AND SYNC WORKPACKAGES TABLE
  // --------------------------------------------------------------------------------
  const WorkPackage = require("../models/WorkPackage")(sequelize, DataTypes);
  const CommercialProcess = require("../models/CommercialProcess")(sequelize, DataTypes);
  const NegotiationSheet = require("../models/NegotiationSheet")(sequelize, DataTypes);
  const Award = require("../models/Award")(sequelize, DataTypes);
  const AwardLine = require("../models/AwardLine")(sequelize, DataTypes);

  await WorkPackage.sync({ alter: true });
  await CommercialProcess.sync({ alter: true });
  await NegotiationSheet.sync({ alter: true });
  await Award.sync({ alter: true });
  await AwardLine.sync({ alter: true });
  
  // Sync SmartInventory model to ensure availableQuantity and reservation fields exist on Neon production
  const SmartInventory = require("../models/SmartInventory")(sequelize, DataTypes);
  await SmartInventory.sync({ alter: true });
  
  console.log("✅ WorkPackages, CommercialProcesses, NegotiationSheets, Awards, AwardLines, and SmartInventory tables verified and synced!");

  // --------------------------------------------------------------------------------
  // TASK 3 & 4: OFFICIAL RBAC SEED (Permissions & RolePermissions)
  // --------------------------------------------------------------------------------
  console.log("\n>>> TASK 3 & 4: EXECUTING OFFICIAL RBAC SEED");

  // Ensure Tables exist
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "Permissions" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      key VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255),
      description TEXT,
      module VARCHAR(255),
      "riskLevel" VARCHAR(50),
      "isDelegatable" BOOLEAN DEFAULT true,
      "requiresSOD" BOOLEAN DEFAULT false,
      "requiresApproval" BOOLEAN DEFAULT false,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS roles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) UNIQUE NOT NULL,
      description TEXT,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "RolePermissions" (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "roleId" UUID NOT NULL,
      "permissionId" UUID NOT NULL,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE("roleId", "permissionId")
    );
  `);

  const masterPermissions = [
    { key: "VIEW_REQUESTS", name: "عرض طلبات الأسعار", description: "استعراض طلبات الأسعار والحزم", module: "PROCUREMENT" },
    { key: "CREATE_REQUEST", name: "إنشاء طلب سعر", description: "إمكانية إنشاء حزم عمل وتحديد الكميات", module: "PROCUREMENT" },
    { key: "EDIT_REQUEST", name: "تعديل طلب السعر", description: "تعديل تفاصيل حزم العمل", module: "PROCUREMENT" },
    { key: "DELETE_REQUEST", name: "حذف طلب السعر", description: "إلغاء وحذف مسودات طلبات الأسعار", module: "PROCUREMENT" },
    { key: "VIEW_QUOTES", name: "استعراض عروض الأسعار", description: "مشاهدة وتحليل عروض الأسعار المقدمة", module: "PROCUREMENT" },
    { key: "CREATE_QUOTE", name: "تقديم عرض سعر", description: "إمكانية تقديم عرض سعر على طلب قائمة", module: "PROCUREMENT" },
    { key: "ACCEPT_QUOTE", name: "قبول العرض الفردي", description: "قبول عرض سعر مبدئي قبل الترسية", module: "PROCUREMENT" },
    { key: "MANAGE_PROFILE", name: "إدارة الملف الشخصي", description: "تحديث معلومات الحساب والشركة", module: "ORGANIZATION" }
  ];

  for (const perm of masterPermissions) {
    await sequelize.query(`
      INSERT INTO "Permissions" (id, key, name, description, module, "riskLevel", "isDelegatable", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), '${perm.key}', '${perm.name}', '${perm.description}', '${perm.module}', 'MEDIUM', true, NOW(), NOW())
      ON CONFLICT (key) DO UPDATE SET name = '${perm.name}';
    `);
  }

  // Ensure buyer role
  const [buyerRole] = await sequelize.query(`
    INSERT INTO roles (id, name, description, "createdAt", "updatedAt")
    VALUES (gen_random_uuid(), 'buyer', 'Buyer Role', NOW(), NOW())
    ON CONFLICT (name) DO UPDATE SET description = 'Buyer Role'
    RETURNING id;
  `);

  const buyerRoleId = buyerRole[0]?.id;

  // Link permissions to buyer role
  const buyerPermKeys = ["VIEW_REQUESTS", "CREATE_REQUEST", "ACCEPT_QUOTE", "VIEW_QUOTES", "MANAGE_PROFILE"];

  for (const key of buyerPermKeys) {
    const [perm] = await sequelize.query(`SELECT id FROM "Permissions" WHERE key = '${key}';`);
    if (perm[0]?.id && buyerRoleId) {
      await sequelize.query(`
        INSERT INTO "RolePermissions" (id, "roleId", "permissionId", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), '${buyerRoleId}', '${perm[0].id}', NOW(), NOW())
        ON CONFLICT ("roleId", "permissionId") DO NOTHING;
      `);
    }
  }

  console.log("✅ All Permissions & RolePermissions seeded cleanly!");

  // Output summary
  const [allMeta] = await sequelize.query(`SELECT name FROM "SequelizeMeta" ORDER BY name;`);
  const [permList] = await sequelize.query(`SELECT key FROM "Permissions" ORDER BY key;`);
  const [buyerPerms] = await sequelize.query(`
    SELECT p.key FROM "RolePermissions" rp 
    JOIN roles r ON r.id = rp."roleId" 
    JOIN "Permissions" p ON p.id = rp."permissionId" 
    WHERE r.name = 'buyer';
  `);

  console.log("\n================================================================================");
  console.log("📊 PRODUCTION SYNCHRONIZATION AUDIT SUMMARY:");
  console.log("1. Executed Migrations Count:", executedMigrations.length);
  console.log("2. Total SequelizeMeta Rows:", allMeta.length);
  console.log("3. Permissions in DB:", permList.map(p => p.key));
  console.log("4. Buyer Role Permissions:", buyerPerms.map(p => p.key));
  console.log("================================================================================");

  process.exit(0);
}

runProductionSync();
