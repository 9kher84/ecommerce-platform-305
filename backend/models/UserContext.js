const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const UserContext = sequelize.define('UserContext', {
        userId: {
            type: DataTypes.UUID,
            references: {
                model: 'users',
                key: 'id',
            },
            primaryKey: true, // One context per user for now? Or allow multiple? ERD implies usage as context profile.
            // Actually usually a user has one primary context or multiple allowed contexts.
            // Based on ERD: user_context | user_id | city_id...
            // It implies a single row defining the user's scope.
        },
        regionId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'regions',
                key: 'id',
            },
        },
        cityId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'cities',
                key: 'id',
            },
        },
        teamId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: {
                model: 'teams',
                key: 'id',
            },
        },
    }, {
        tableName: 'user_context',
        timestamps: true,
    });

    return UserContext;
};
