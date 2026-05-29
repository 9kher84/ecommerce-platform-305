// backend/models/Sanction.js
module.exports = (sequelize, DataTypes) => {
  const Sanction = sequelize.define(
    "Sanction",
    {
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      sanctionType: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      reason: {
        type: DataTypes.TEXT,
      },
      startDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      endDate: {
        type: DataTypes.DATE,
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      createdBy: {
        type: DataTypes.INTEGER,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "sanctions",
      timestamps: false,
      underscored: true,
    },
  );

  Sanction.associate = (models) => {
    if (models.User) {
      Sanction.belongsTo(models.User, { foreignKey: "userId", as: "user" });
      Sanction.belongsTo(models.User, {
        foreignKey: "createdBy",
        as: "creator",
      });
    }
  };

  return Sanction;
};
