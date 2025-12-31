const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Deal = sequelize.define('Deal', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        finalAmount: {
            type: DataTypes.DECIMAL(10, 2),
        },
        // ✅ تغيير من postId إلى purchaseRequestId
        purchaseRequestId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        // ✅ تغيير من offerId إلى quoteId
        quoteId: {
            type: DataTypes.UUID,  // UUID لأن PriceQuote يستخدم UUID
            allowNull: false,
            unique: true,
        },
        sellerId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        buyerId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        status: {
            // ✅ تحديث حالات الصفقة لتتناسب مع النظام الجديد
            type: DataTypes.ENUM('processing', 'paid', 'delivered'),
            defaultValue: 'processing'
        }
    }, {
        tableName: 'deals',
        modelName: 'Deal',
        timestamps: true,
        indexes: [
            { fields: ['purchaseRequestId'] },  // ✅ تحديث
            { fields: ['quoteId'] },            // ✅ تحديث
            { fields: ['sellerId'] },
            { fields: ['buyerId'] },
            { fields: ['status'] },
        ]
    });

    return Deal;
};