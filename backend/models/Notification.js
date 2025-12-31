module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Notification', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        type: {
            type: DataTypes.STRING,
            defaultValue: 'info'
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        entityId: {
            type: DataTypes.UUID,
            allowNull: true
        }
    });
};
