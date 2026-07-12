const { sequelize } = require('./sequelize_setup');

async function addAiProposalsColumn() {
  try {
    console.log("Adding ai_proposals column to Products table...");
    await sequelize.query(`ALTER TABLE "Products" ADD COLUMN IF NOT EXISTS "ai_proposals" JSONB;`);
    console.log("Column added successfully!");
  } catch (error) {
    console.error("Failed to add column:", error);
  } finally {
    process.exit();
  }
}

addAiProposalsColumn();
