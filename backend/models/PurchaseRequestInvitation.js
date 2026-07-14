module.exports = (sequelize, DataTypes) => {
  const PurchaseRequestInvitation = sequelize.define(
    "PurchaseRequestInvitation",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      purchaseRequestId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      sellerOrganizationId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("pending", "viewed", "declined", "quoted"),
        defaultValue: "pending",
      },
      sentAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      openedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      declinedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      paranoid: true,
      timestamps: true,
    }
  );

  return PurchaseRequestInvitation;
};
