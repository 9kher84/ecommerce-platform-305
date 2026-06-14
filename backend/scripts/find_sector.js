require('dotenv').config();
const { sequelize, Category, User } = require('../sequelize_setup');

async function checkAll() {
  // Check UserCategories with correct column names (lowercase)
  const [buyer1Cats] = await sequelize.query(`
    SELECT uc."userId", uc."categoryId", c.name_en
    FROM "UserCategories" uc
    JOIN categories c ON c.id = uc."categoryId"
    WHERE uc."userId" = '9b495469-c8af-45a5-84d0-5cd4f630dc79'
  `);
  console.log("buyer1 categories:", buyer1Cats);

  // Check Category model attributes
  console.log("Category model attributes:", Object.keys(Category.rawAttributes));

  // The requestController looks for: Category.findOne({ where: { id: sectorId, type: 'SECTOR' } })
  // If categories has no 'type' column, this query will fail or return null always.
  // Let's check if 'type' is in the model
  const hasType = Category.rawAttributes.type !== undefined;
  console.log("Category model has 'type' field:", hasType);

  process.exit();
}
checkAll().catch(e => { console.error(e.message); process.exit(); });
