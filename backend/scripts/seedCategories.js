const { Category } = require('../models');

async function seedCategories() {
  try {
    const count = await Category.count();
    if (count === 0) {
      await Category.bulkCreate([
        { name: 'تقنية', description: 'منتجات وخدمات تقنية' },
        { name: 'تسويق', description: 'خدمات تسويقية وإعلانية' },
        { name: 'بناء', description: 'مواد بناء ومقاولات' },
        { name: 'استشارات', description: 'خدمات استشارية' },
        { name: 'تعليم', description: 'دورات وخدمات تعليمية' },
      ]);
      console.log('✅ Default categories seeded.');
    }
  } catch (error) {
    console.error('⚠️ Failed to seed categories:', error.message);
  }
}

module.exports = seedCategories;
