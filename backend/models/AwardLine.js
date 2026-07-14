module.exports = (sequelize, DataTypes) => {
  const AwardLine = sequelize.define(
    "AwardLine",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      awardId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      purchaseRequestItemId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      quotationItemId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      sellerOrganizationId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      productDNAId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      quantityAwarded: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      unitPriceAwarded: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING,
        defaultValue: "SAR",
      },
      taxRate: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 15.00,
      },
      discount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00,
      },
      leadTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      // FULL SNAPSHOT AS REQUESTED
      snapshot: {
        type: DataTypes.JSONB,
        allowNull: false,
        comment: "Immutable snapshot of the quoted item and quotation summary at time of award",
      }
    },
    {
      paranoid: true,
      timestamps: true,
      indexes: [
        { fields: ["awardId"] },
        { fields: ["purchaseRequestItemId"] },
      ],
    }
  );

  return AwardLine;
};
