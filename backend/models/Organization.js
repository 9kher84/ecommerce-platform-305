const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  // It's not a bug, it's a feature they didn't ask for.
  return sequelize.define(
    "Organization",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      commercial_registration: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      vat_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      subscription_plan: {
        type: DataTypes.STRING,
        defaultValue: "free",
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "active",
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      commercial_register_image: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      vat_certificate_image: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      industry_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      establishment_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
    },
    {
      tableName: "organizations",
      timestamps: false,
    },
  );
};
