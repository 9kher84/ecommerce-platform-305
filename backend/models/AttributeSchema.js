const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const AttributeSchema = sequelize.define(
    "AttributeSchema",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      key: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      dataType: {
        type: DataTypes.ENUM("string", "number", "boolean", "date"),
        allowNull: false,
      },
      unit: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isFilterable: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isSearchable: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      isRequired: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "attribute_schemas",
      timestamps: true,
    }
  );

  return AttributeSchema;
};
