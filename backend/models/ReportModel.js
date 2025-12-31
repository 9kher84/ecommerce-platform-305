const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Report = sequelize.define('Report', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        reporterId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        reportType: {
            type: DataTypes.ENUM('deal', 'post', 'user', 'rating', 'other'),
            allowNull: false,
        },
        entityId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        reason: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        status: {
            type: DataTypes.ENUM('pending', 'in_review', 'resolved', 'rejected'),
            allowNull: false,
            defaultValue: 'pending',
        },
        resolutionDetails: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        resolvedBy: {
            type: DataTypes.UUID,
            allowNull: true,
        }
    }, {
        tableName: 'reports',
        timestamps: true,
        indexes: [
            { fields: ['reporterId'] },
            { fields: ['reportType', 'entityId'] },
            { fields: ['status'] },
        ]
    });

    return Report;
};