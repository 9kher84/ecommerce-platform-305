module.exports = (sequelize, DataTypes) => {
  const UserCategory = sequelize.define(
    "UserCategory",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Categories",
          key: "id",
        },
      },
    },
    {
      tableName: "UserCategories",
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["userId", "categoryId"],
        },
      ],
    },
  );

  // 🔥 Sovereign Validation: Only allow "SECTOR" type categories to be linked to users
  UserCategory.beforeCreate(async (instance, options) => {
    const { Category } = sequelize.models; // Use internal models for lookup
    const category = await Category.findByPk(instance.categoryId);
    if (!category || category.type !== "SECTOR") {
      throw new Error(
        "Sovereign Hard Rule: Users can only be linked to categories of type SECTOR.",
      );
    }
  });

  return UserCategory;
};
