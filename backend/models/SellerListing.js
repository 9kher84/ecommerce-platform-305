const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const SellerListing = sequelize.define(
    "SellerListing",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      dnaId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      organizationId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      createdByUserId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      sellerSku: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      currencyCode: {
        type: DataTypes.STRING,
        defaultValue: 'SAR',
        allowNull: false,
      },
      stockLevel: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      lowStockThreshold: {
        type: DataTypes.INTEGER,
        defaultValue: 10,
      },
      deliveryTime: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      origin: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      autoNegotiationEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      minAcceptablePrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("draft", "active", "paused", "out_of_stock", "archived"),
        defaultValue: "draft",
      },
      legacyProductId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      migrationVersion: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1,
      },
    },
    {
      tableName: "seller_listings",
      timestamps: true,
      paranoid: true, // Soft delete support (adds deletedAt)
      indexes: [
        {
          unique: true,
          fields: ["dnaId", "organizationId"], // Prevent multiple listings of the same DNA by same Org
        },
        {
          unique: true,
          fields: ["organizationId", "sellerSku"], // Prevent duplicate SKU within the same Org
        },
        {
          fields: ["price"], // Fast filtering by price
        },
        {
          fields: ["status"], // Fast filtering active/paused listings
        },
      ],
    }
  );

  return SellerListing;
};
