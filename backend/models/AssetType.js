module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "AssetType",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // e.g., 'SPOT_DEAL', 'STANDARD', 'SERVICE', 'CAPACITY'
      },
      name: {
        type: DataTypes.JSON, // { ar: 'صفقة فورية', en: 'Spot Deal' }
        allowNull: false,
      },
      description: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      timestamps: true,
      indexes: [
        { fields: ["code"] },
        { fields: ["isActive"] }
      ]
    }
  );
};
