const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Inventory = sequelize.define('Inventory', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        sellerId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        productName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        quantity: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0
        },
        unit: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        pricePerUnit: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        }
    }, {
        tableName: 'inventory',
        timestamps: true,
        indexes: [
            { fields: ['sellerId'] }
        ]
    });

    return Inventory;
};
