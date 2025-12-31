const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const City = sequelize.define('City', {
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
        regionId: {
            type: DataTypes.UUID,
            references: {
                model: 'regions',
                key: 'id',
            },
        },
    }, {
        tableName: 'cities',
        timestamps: true,
    });

    return City;
};
