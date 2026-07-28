module.exports = (sequelize, DataTypes) => {
  const CommercialProcess = sequelize.define(
    "CommercialProcess",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      workPackageId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      processType: {
        type: DataTypes.ENUM("NEGOTIATION", "COLLABORATION", "LIQUIDATION", "BROKERAGE", "TENDER"),
        defaultValue: "NEGOTIATION",
      },
      status: {
        type: DataTypes.ENUM("draft", "waiting_seller", "waiting_buyer", "agreed", "pending_award", "awarded", "cancelled", "expired", "closed"),
        defaultValue: "draft",
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
    },
    {
      paranoid: true,
      timestamps: true,
    }
  );

  return CommercialProcess;
};
