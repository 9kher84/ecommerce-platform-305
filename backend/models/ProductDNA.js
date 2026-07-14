const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProductDNA = sequelize.define(
    "ProductDNA",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      brandId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      normalizedName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      baseImage: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "product_dna",
      timestamps: true,
    }
  );

  return ProductDNA;
};
