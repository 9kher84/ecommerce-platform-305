const { sequelize, Product, SmartInventory } = require('../sequelize_setup');
const { DataTypes } = require('sequelize');

async function migrate() {
    const queryInterface = sequelize.getQueryInterface();
    try {
        await sequelize.authenticate();
        console.log('Connected.');

        // 1. Create SmartInventory Table
        console.log('Creating SmartInventory table...');
        await SmartInventory.sync({ alter: true });

        // 2. Add Columns to Products
        console.log('Checking Products table columns...');
        const tableInfo = await queryInterface.describeTable('Products');

        if (!tableInfo.productTier) {
            console.log('Adding productTier...');
            await queryInterface.addColumn('Products', 'productTier', {
                type: DataTypes.ENUM('basic', 'smart', 'ai_assisted'),
                defaultValue: 'basic'
            });
        }
        if (!tableInfo.description) {
            console.log('Adding description...');
            await queryInterface.addColumn('Products', 'description', {
                type: DataTypes.JSON,
                allowNull: true
            });
        }
        if (!tableInfo.purchasePrice) {
            console.log('Adding purchasePrice...');
            await queryInterface.addColumn('Products', 'purchasePrice', {
                type: DataTypes.STRING,
                allowNull: true
            });
        }
        if (!tableInfo.autoNegotiationEnabled) {
            console.log('Adding autoNegotiationEnabled...');
            await queryInterface.addColumn('Products', 'autoNegotiationEnabled', {
                type: DataTypes.BOOLEAN,
                defaultValue: false
            });
        }
        if (!tableInfo.minAcceptablePrice) {
            console.log('Adding minAcceptablePrice...');
            await queryInterface.addColumn('Products', 'minAcceptablePrice', {
                type: DataTypes.DECIMAL(10, 2),
                allowNull: true
            });
        }
        if (!tableInfo.negotiationStrategy) {
            console.log('Adding negotiationStrategy...');
            await queryInterface.addColumn('Products', 'negotiationStrategy', {
                type: DataTypes.JSON,
                allowNull: true
            });
        }

        // 3. Handle 'name' conversion
        console.log('Handling name conversion...');
        // Check if name is already NOT string (i.e. already migrated) or if we need to migrate.
        // tableInfo.name.type might be 'VARCHAR(255)' or 'JSON'

        // We will try to rename and recreate only if it looks like the old type.
        // Note: describeTable types are often database specific strings (e.g. "VARCHAR(255)").

        let needMigration = false;
        try {
            // Check if we can parse the content of a row as matches our new structure?
            // Or just check type.
            if (tableInfo.name && (tableInfo.name.type.includes('VAR') || tableInfo.name.type.includes('CHAR') || tableInfo.name.type.includes('TEXT'))) {
                needMigration = true;
            }
        } catch (e) { }

        if (needMigration) {
            console.log('Migrating name column (Rename -> Create -> Move Data -> Drop Old)...');
            try {
                await queryInterface.renameColumn('Products', 'name', 'name_old');
                await queryInterface.addColumn('Products', 'name', { type: DataTypes.JSON, allowNull: true });

                const [products] = await sequelize.query("SELECT id, name_old FROM Products");
                for (const p of products) {
                    // Create structure { ar: "Val", en: "Val" }
                    const val = p.name_old || "";
                    const newName = { en: val, ar: val };

                    // Use bind parameters for safety
                    await sequelize.query(
                        "UPDATE Products SET name = :name WHERE id = :id",
                        { replacements: { name: JSON.stringify(newName), id: p.id } }
                    );
                }

                // Remove old column
                await queryInterface.removeColumn('Products', 'name_old');
                console.log('Name column migrated successfully.');
            } catch (err) {
                console.error('Error during name migration (might have partially failed or already run):', err.message);
                // If rename failed, maybe it was already renamed?
            }
        } else {
            console.log('Name column seems to be already migrated or JSON.');
        }

        console.log('Migration complete.');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await sequelize.close();
    }
}

migrate();
