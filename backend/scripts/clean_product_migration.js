const fs = require("fs");
const path = require("path");
const { sequelize, SmartInventory } = require("../sequelize_setup");
const { DataTypes } = require("sequelize");

// Silent File Logger for Migration
const LOG_FILE = path.join(
  __dirname,
  "../database-reports/migration_silent.log",
);

// Ensure log dir exists
try {
  const dir = path.dirname(LOG_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
} catch (e) {}

/**
 * Conditional Logging Wrapper
 * Only writes to file if MIGRATION_LOGGING env var is 'true'.
 * This prevents IO pressure and info leakage in production unless explicitly enabled.
 */
function log(msg) {
  if (process.env.MIGRATION_LOGGING === "true") {
    fs.appendFileSync(LOG_FILE, `[INFO] ${new Date().toISOString()}: ${msg}\n`);
  }
}

function logError(msg) {
  if (process.env.MIGRATION_LOGGING === "true") {
    fs.appendFileSync(
      LOG_FILE,
      `[ERROR] ${new Date().toISOString()}: ${msg}\n`,
    );
  }
}

/**
 * Sovereign Clean Migration
 * Idempotent & Reversible & SILENT (Console Free)
 */
async function cleanMigrate() {
  const queryInterface = sequelize.getQueryInterface();
  const transaction = await sequelize.transaction();

  try {
    await sequelize.authenticate();
    log("Connected to DB.");

    // 1. SmartInventory Table
    log("Syncing SmartInventory...");
    await SmartInventory.sync({ force: false, alter: true, transaction });

    // 2. Product Columns
    const tableInfo = await queryInterface.describeTable("Products");

    const newColumns = {
      productTier: {
        type: DataTypes.ENUM("basic", "smart", "ai_assisted"),
        defaultValue: "basic",
      },
      description: { type: DataTypes.JSON, allowNull: true },
      purchasePrice: { type: DataTypes.STRING, allowNull: true },
      autoNegotiationEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
      minAcceptablePrice: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
      negotiationStrategy: { type: DataTypes.JSON, allowNull: true },
    };

    for (const [colName, colDef] of Object.entries(newColumns)) {
      if (!tableInfo[colName]) {
        log(`Adding ${colName}...`);
        await queryInterface.addColumn("Products", colName, colDef, {
          transaction,
        });
      }
    }

    // 3. Name Migration Check
    if (
      tableInfo.name.type !== "JSON" &&
      !tableInfo.name.type.includes("JSON")
    ) {
      log("Name column is not JSON. Migrating...");

      try {
        // If rename fails, it might be because name_old exists.
        await queryInterface.renameColumn("Products", "name", "name_old", {
          transaction,
        });
      } catch (e) {
        log("Rename check: name_old might exist.");
      }

      // Create new JSON column
      await queryInterface.addColumn(
        "Products",
        "name",
        {
          type: DataTypes.JSON,
          allowNull: false,
          defaultValue: { en: "Unknown", ar: "غير معروف" },
        },
        { transaction },
      );

      // Copy Data
      const [rows] = await sequelize.query(
        `SELECT id, name_old FROM "Products"`,
        { transaction },
      );

      for (const row of rows) {
        let oldName = row.name_old || "Product";
        let newJson = JSON.stringify({ en: oldName, ar: oldName });
        await sequelize.query(
          `UPDATE "Products" SET "name" = '${newJson}' WHERE "id" = '${row.id}'`,
          { transaction },
        );
      }

      // Drop old
      await queryInterface.removeColumn("Products", "name_old", {
        transaction,
      });
      log("Name migration complete.");
    } else {
      log("Name is already JSON.");
    }

    await transaction.commit();
    log("Migration committed successfully.");
  } catch (error) {
    await transaction.rollback();
    logError("Migration failed. Rolled back. Error: " + error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

cleanMigrate();
