// backend/models/TrustScore.js
module.exports = (sequelize, DataTypes) => {
  const TrustScore = sequelize.define(
    "TrustScore",
    {
      userId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
      },
      reliabilityIndex: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0.0,
      },
      completionRate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0.0,
      },
      cancellationRate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0.0,
      },
      responseTimeAvg: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      lastUpdated: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "trust_scores",
      timestamps: false,
      underscored: true,
    },
  );

  TrustScore.associate = (models) => {
    if (models.User) {
      TrustScore.belongsTo(models.User, { foreignKey: "userId", as: "user" });
    }
  };

  return TrustScore;
};
