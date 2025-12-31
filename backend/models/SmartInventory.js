module.exports = (sequelize, DataTypes) => {
    return sequelize.define('SmartInventory', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        productId: {
            type: DataTypes.UUID,
            allowNull: false
            // References Product handled in associations
        },
        sellerId: {
            type: DataTypes.UUID,
            allowNull: false
            // References User handled in associations
        },
        storageCapacity: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        expectedIncomingStock: {
            type: DataTypes.JSON, // Stores array of expected shipments
            allowNull: true
        },
        storageDurationDays: {
            type: DataTypes.INTEGER,
            allowNull: true
        },
        manufactureDate: {
            type: DataTypes.DATE,
            allowNull: true
        },
        warehousePressureScore: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        }
    });
};
