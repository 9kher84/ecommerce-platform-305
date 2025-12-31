module.exports = (sequelize, DataTypes) => {
    return sequelize.define('RefreshToken', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        jti: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        device_id: {
            type: DataTypes.STRING,
            allowNull: true
        },
        device_fingerprint: {
            type: DataTypes.STRING,
            allowNull: true
        },
        revoked: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        last_used_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        expires_at: {
            type: DataTypes.DATE,
            allowNull: false
        }
    }, {
        tableName: 'refresh_tokens',
        timestamps: true,
        updatedAt: false
    });
};
