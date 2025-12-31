const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Team = sequelize.define('Team', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        cityId: {
            type: DataTypes.UUID,
            references: {
                model: 'cities',
                key: 'id',
            },
        },
    }, {
        tableName: 'teams',
        timestamps: true,
    });

    return Team;
};
