// C:\Users\s9khr\sasasa\ecommerce-platform\backend\models\CategoryModel.js

module.exports = (sequelize, DataTypes) => {
    const Category = sequelize.define('Category', {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name_ar: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        name_en: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        description_ar: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        description_en: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
    }, {
        tableName: 'categories',
        timestamps: true,
    });

    return Category;
};