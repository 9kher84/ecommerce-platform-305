const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const UserRole = sequelize.define('UserRole', {
        userId: {
            type: DataTypes.UUID,
            references: {
                model: 'users',
                key: 'id',
            },
        },
        roleId: {
            type: DataTypes.UUID,
            references: {
                model: 'roles',
                key: 'id',
            },
        },
    }, {
        tableName: 'user_roles',
        timestamps: true,
    });

    return UserRole;
};
