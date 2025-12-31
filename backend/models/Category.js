module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Category', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name_ar: {
            type: DataTypes.STRING,
            allowNull: false
        },
        name_en: {
            type: DataTypes.STRING,
            allowNull: false
        },
        description_ar: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        description_en: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    });
};