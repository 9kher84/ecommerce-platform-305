const fs = require("fs");
const path = require("path");
const { sequelize } = require("../sequelize_setup");

async function applyIndexes() {
  try {
    console.log("🚀 Applying Performance Indexes...");

    const sqlPath = path.join(__dirname, "../database/performance_indexes.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    // Split by statement (naively by semicolon at end of line for simplicity)
    // Or just run the whole block if supported, but safer to run individually
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      await sequelize.query(statement);
    }

    console.log("✅ All indexes applied successfully.");
  } catch (error) {
    console.error("❌ Error applying indexes:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  applyIndexes();
}
