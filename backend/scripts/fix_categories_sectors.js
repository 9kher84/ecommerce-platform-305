require('dotenv').config();
const { sequelize } = require('../sequelize_setup');

async function fixEverything() {
  // Step 1: What does "Categories" table have?
  const [catCols] = await sequelize.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'Categories' ORDER BY ordinal_position
  `);
  console.log("'Categories' (capital C) columns:", catCols.map(c => c.column_name));

  const colNames = catCols.map(c => c.column_name);

  // Step 2: Add missing columns to "Categories" (capital C)
  if (!colNames.includes('type')) {
    await sequelize.query(`ALTER TABLE "Categories" ADD COLUMN type VARCHAR(50) DEFAULT 'SECTOR'`);
    console.log("✅ Added 'type' to 'Categories'");
  }
  if (!colNames.includes('parentId')) {
    await sequelize.query(`ALTER TABLE "Categories" ADD COLUMN "parentId" INTEGER DEFAULT NULL`);
    console.log("✅ Added 'parentId' to 'Categories'");
  }
  if (!colNames.includes('isActive')) {
    await sequelize.query(`ALTER TABLE "Categories" ADD COLUMN "isActive" BOOLEAN DEFAULT true`);
    console.log("✅ Added 'isActive' to 'Categories'");
  }

  // Step 3: Update all existing Categories to type=SECTOR
  await sequelize.query(`UPDATE "Categories" SET type = 'SECTOR', "parentId" = NULL, "isActive" = true`);
  console.log("✅ Updated all Categories to type=SECTOR");

  // Step 4: Fix UserCategories FK - categoryId should point to "Categories" (capital), userId to users (lowercase)
  // First check current FKs
  const [fks] = await sequelize.query(`
    SELECT kcu.column_name, ccu.table_name AS foreign_table, tc.constraint_name
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'UserCategories'
  `);
  console.log("Current UserCategories FKs:", fks);

  // Drop and re-add the categoryId FK to point to "Categories" (capital C)
  for (const fk of fks) {
    if (fk.column_name === 'categoryId') {
      await sequelize.query(`ALTER TABLE "UserCategories" DROP CONSTRAINT "${fk.constraint_name}"`);
      await sequelize.query(`
        ALTER TABLE "UserCategories" 
        ADD CONSTRAINT "UserCategories_categoryId_fkey"
        FOREIGN KEY ("categoryId") REFERENCES "Categories"(id) ON DELETE CASCADE ON UPDATE CASCADE
      `);
      console.log("✅ Fixed categoryId FK → 'Categories' (capital C)");
    }
  }

  // Step 5: Clear and re-insert buyer1's category
  await sequelize.query(`DELETE FROM "UserCategories" WHERE "userId" = '9b495469-c8af-45a5-84d0-5cd4f630dc79'`);

  // Check what's in "Categories" table
  const [cats] = await sequelize.query(`SELECT id, name_en, type FROM "Categories" LIMIT 5`);
  console.log("Categories in 'Categories' table:", cats);

  if (cats.length > 0) {
    const catId = cats[0].id;
    await sequelize.query(`
      INSERT INTO "UserCategories" ("userId", "categoryId", "createdAt", "updatedAt")
      VALUES ('9b495469-c8af-45a5-84d0-5cd4f630dc79', ${catId}, NOW(), NOW())
    `);
    console.log(`✅ Linked buyer1 to Category id=${catId} (${cats[0].name_en})`);
  }

  // Final verification via Sequelize ORM (same as RBAC check)
  const { User, Category } = require('../sequelize_setup');
  const user = await User.findByPk('9b495469-c8af-45a5-84d0-5cd4f630dc79', {
    include: [{ model: Category, as: 'sectors', where: { id: cats[0]?.id }, required: false }]
  });
  console.log("Sequelize ORM check - buyer1 sectors:", user?.sectors?.map(s => s.name_en));

  process.exit(0);
}

fixEverything().catch(e => { console.error("Fatal:", e.message); process.exit(1); });
