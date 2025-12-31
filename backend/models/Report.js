module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Report', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        type: {
            type: DataTypes.ENUM('bad_post', 'impersonation', 'fraud', 'deal_corruption', 'other'),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        attachmentUrl: {
            type: DataTypes.STRING,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('pending', 'investigating', 'resolved', 'dismissed'),
            defaultValue: 'pending'
        }
    }, {
        timestamps: true
    });
};
