const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Offer = sequelize.define('Offer', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                isFloat: true,
                min: 0.01
            }
        },
        currency: {
            type: DataTypes.STRING(3),
            allowNull: false,
            defaultValue: 'SAR'
        },
        status: {
            type: DataTypes.ENUM('pending', 'accepted', 'rejected'),
            allowNull: false,
            defaultValue: 'pending',
        },
        postId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        buyerId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    }, {
        tableName: 'offers',
        modelName: 'Offer',
        timestamps: true,
        indexes: [
            { fields: ['postId'] },
            { fields: ['buyerId'] },
        ]
    });

    Offer.associate = (models) => {
        Offer.belongsTo(models.Post, { foreignKey: 'postId', as: 'post' });
        Offer.belongsTo(models.User, { foreignKey: 'buyerId', as: 'seller' });
    };

    return Offer;
};