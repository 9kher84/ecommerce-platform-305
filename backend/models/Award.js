module.exports = (sequelize, DataTypes) => {
  const Award = sequelize.define(
    "Award",
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
      quotationId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
      },
      buyerOrganizationId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      sellerOrganizationId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("accepted", "confirmed", "completed", "cancelled"),
        defaultValue: "accepted",
      },
      totalAmount: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
      },
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      }
    },
    {
      paranoid: true,
      timestamps: true,
      indexes: [
        { fields: ["purchaseRequestId"] },
        { fields: ["sellerOrganizationId"] },
        { fields: ["status"] },
      ],
    }
  );

  return Award;
};
