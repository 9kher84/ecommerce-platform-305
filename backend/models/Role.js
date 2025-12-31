const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Role = sequelize.define('Role', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            comment: 'Human readable name (e.g., City Manager)',
        },
        level: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: 'Hierarchy level for UI/display purposes (0-100)',
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    }, {
        tableName: 'roles',
        timestamps: true,
    });

    return Role;
};
