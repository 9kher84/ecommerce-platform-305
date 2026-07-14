const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const ProductDNAAttribute = sequelize.define(
    "ProductDNAAttribute",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      dnaId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      attributeId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      valueString: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      valueNumber: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      valueBoolean: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
      },
      valueDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "product_dna_attributes",
      timestamps: true,
      validate: {
        onlyOneValueConstraint() {
          let filledColumns = 0;
          if (this.valueString !== null && this.valueString !== undefined) filledColumns++;
          if (this.valueNumber !== null && this.valueNumber !== undefined) filledColumns++;
          if (this.valueBoolean !== null && this.valueBoolean !== undefined) filledColumns++;
          if (this.valueDate !== null && this.valueDate !== undefined) filledColumns++;

          if (filledColumns > 1) {
            throw new Error('Only one value column (valueString, valueNumber, valueBoolean, valueDate) can be set at a time.');
          }
        }
      },
      indexes: [
        {
          unique: true,
          fields: ["dnaId", "attributeId"],
        },
        {
          fields: ["attributeId"], // Index for fast filtering by attribute
        }
      ],
    }
  );

  return ProductDNAAttribute;
};
