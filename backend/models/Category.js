// backend/models/Category.js
module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define(
    "Category",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
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
      parentId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "parentId", // Explicitly map to camelCase column
        references: {
          model: "Categories",
          key: "id",
        },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: "isActive",
      },
      type: {
        type: DataTypes.ENUM(
          "SECTOR",
          "CATEGORY",
          "PRODUCT_CATEGORY",
          "SUBCATEGORY",
        ),
        defaultValue: "CATEGORY",
      },
      createdAt: {
        type: DataTypes.DATE,
        field: "createdAt",
      },
      updatedAt: {
        type: DataTypes.DATE,
        field: "updatedAt",
      },
    },
    {
      tableName: "Categories",
      timestamps: true,
      underscored: false, // Ensure it doesn't try to use snake_case
    },
  );

  return Category;
};
