module.exports = (sequelize, DataTypes) => {
    const SystemSetting = sequelize.define('SystemSetting', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        key: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        value: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM('string', 'boolean', 'number', 'json'),
            defaultValue: 'string',
        },
        isEncrypted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        description: {
            type: DataTypes.STRING,
            allowNull: true,
        }
    }, {
        tableName: 'system_settings',
        timestamps: true,
    });

    return SystemSetting;
};
