module.exports = (sequelize, DataTypes) => {
  const SellerDecision = sequelize.define(
    "SellerDecision",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
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
      requestId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "PurchaseRequests",
          key: "id",
        },
      },
      action: {
        type: DataTypes.ENUM("accept", "reject", "counter"),
        allowNull: false,
      },
      recommendedPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      actualPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      profitMargin: {
        type: DataTypes.DECIMAL(5, 2), // Percentage calculation
        allowNull: true,
      },
      decisionTime: {
        type: DataTypes.INTEGER, // Time in seconds taken to decide
        allowNull: true,
      },
      reasoningMatch: {
        type: DataTypes.BOOLEAN,
        defaultValue: true, // Whether user followed recommendation logic
      },
    },
    {
      tableName: "SellerDecisions",
      timestamps: true,
    },
  );

  return SellerDecision;
};
