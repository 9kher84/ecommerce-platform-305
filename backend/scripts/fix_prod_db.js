const { Sequelize } = require('sequelize');

async function runProdFixes() {
  const sequelize = new Sequelize('postgresql://neondb_owner:npg_hudwpP4y8bvU@ep-rapid-river-ap7l6xha-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require', {
    dialect: 'postgres',
    logging: false
  });

  try {
    await sequelize.authenticate();
    console.log("✅ Connected to Production DB");

    const t = await sequelize.transaction();
    try {
      // 1. Fix user_roles Foreign Keys
      console.log("⏳ Fixing user_roles FKs...");
      await sequelize.query(`ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS "user_roles_userId_fkey"`, { transaction: t });
      await sequelize.query(`TRUNCATE TABLE user_roles`, { transaction: t });
      await sequelize.query(`
        ALTER TABLE user_roles 
        ADD CONSTRAINT "user_roles_userId_fkey" 
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
      `, { transaction: t });

      // Link users to roles in user_roles
      await sequelize.query(`
        INSERT INTO user_roles ("userId", "roleId", "createdAt", "updatedAt")
        SELECT u.id, r.id, NOW(), NOW()
        FROM users u
        JOIN roles r ON r.name = u.role::text
        ON CONFLICT DO NOTHING
      `, { transaction: t });
      console.log("✅ Fixed user_roles and populated mappings");

      // 2. Fix Categories missing columns
      console.log("⏳ Fixing Categories table...");
      await sequelize.query(`ALTER TABLE "Categories" ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'SECTOR'`, { transaction: t });
      await sequelize.query(`ALTER TABLE "Categories" ADD COLUMN IF NOT EXISTS "parentId" INTEGER DEFAULT NULL`, { transaction: t });
      await sequelize.query(`ALTER TABLE "Categories" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true`, { transaction: t });
      await sequelize.query(`UPDATE "Categories" SET type = 'SECTOR', "parentId" = NULL, "isActive" = true`, { transaction: t });
      console.log("✅ Added missing columns to Categories and set to SECTOR");

      // 3. Fix UserCategories Foreign Keys
      console.log("⏳ Fixing UserCategories FKs...");
      await sequelize.query(`ALTER TABLE "UserCategories" DROP CONSTRAINT IF EXISTS "UserCategories_userId_fkey"`, { transaction: t });
      await sequelize.query(`ALTER TABLE "UserCategories" DROP CONSTRAINT IF EXISTS "UserCategories_categoryId_fkey"`, { transaction: t });
      await sequelize.query(`TRUNCATE TABLE "UserCategories"`, { transaction: t });
      await sequelize.query(`
        ALTER TABLE "UserCategories" ADD CONSTRAINT "UserCategories_userId_fkey" FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
      `, { transaction: t });
      await sequelize.query(`
        ALTER TABLE "UserCategories" ADD CONSTRAINT "UserCategories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Categories"(id) ON DELETE CASCADE ON UPDATE CASCADE
      `, { transaction: t });

      // Add a dummy category if none exists and link buyer1 to it
      const [cats] = await sequelize.query(`SELECT id FROM "Categories" LIMIT 1`, { transaction: t });
      let catId = cats.length > 0 ? cats[0].id : null;
      if (!catId) {
        const [insertedCat] = await sequelize.query(`
          INSERT INTO "Categories" ("name_en", "name_ar", "type", "createdAt", "updatedAt") 
          VALUES ('General Sector', 'قطاع عام', 'SECTOR', NOW(), NOW()) RETURNING id
        `, { transaction: t });
        catId = insertedCat[0].id;
      }
      
      const [buyer1] = await sequelize.query(`SELECT id FROM users WHERE email = 'buyer1@testdata.com'`, { transaction: t });
      if (buyer1.length > 0) {
        await sequelize.query(`
          INSERT INTO "UserCategories" ("userId", "categoryId", "createdAt", "updatedAt")
          VALUES ('${buyer1[0].id}', ${catId}, NOW(), NOW())
        `, { transaction: t });
        console.log(`✅ Linked buyer1 to Category ID: ${catId}`);
      }

      // 4. Fix PurchaseRequests issues (organization_id and FKs)
      console.log("⏳ Fixing PurchaseRequests issues...");
      await sequelize.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id UUID DEFAULT NULL`, { transaction: t });
      await sequelize.query(`ALTER TABLE "PurchaseRequests" ADD COLUMN IF NOT EXISTS organization_id UUID DEFAULT NULL`, { transaction: t });
      
      await sequelize.query(`ALTER TABLE "PurchaseRequests" DROP CONSTRAINT IF EXISTS "PurchaseRequests_userId_fkey"`, { transaction: t });
      await sequelize.query(`TRUNCATE TABLE "PurchaseRequests" CASCADE`, { transaction: t }); // Clear bad data
      await sequelize.query(`
        ALTER TABLE "PurchaseRequests"
        ADD CONSTRAINT "PurchaseRequests_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
      `, { transaction: t });
      console.log("✅ Fixed PurchaseRequests userId FK and organization_id columns");

      await t.commit();
      console.log("🎉 All fixes applied successfully on Production DB!");
      
    } catch (e) {
      await t.rollback();
      throw e;
    }
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Fatal Error:", err.message);
    process.exit(1);
  }
}

runProdFixes();
