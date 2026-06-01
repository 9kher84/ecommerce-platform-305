const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const PaymentMethod = sequelize.define(
    "PaymentMethod",
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
      // Payment Method Type
      type: {
        type: DataTypes.ENUM("card", "wallet", "bank_transfer"),
        allowNull: false,
      },
      provider: {
        type: DataTypes.ENUM(
          "mada",
          "stc_pay",
          "apple_pay",
          "visa",
          "mastercard",
        ),
        allowNull: false,
      },
      // Tokenized Data (NO PAN STORAGE - PCI DSS Compliance)
      token: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment:
          "Tokenized payment method from gateway - NEVER store actual card numbers",
      },
      // Display Information (Safe to store)
      lastFourDigits: {
        type: DataTypes.STRING(4),
        allowNull: true,
        comment: "Last 4 digits for display purposes only",
      },
      cardBrand: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "e.g., Visa, Mastercard, Mada",
      },
      expiryMonth: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 1,
          max: 12,
        },
      },
      expiryYear: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: {
          min: 2024,
        },
      },
      // Status
      isDefault: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
      },
      // Metadata
      billingAddress: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: "Encrypted billing address if required",
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      tableName: "payment_methods",
      timestamps: true,
      indexes: [
        { fields: ["userId"] },
        { fields: ["token"], unique: true },
        { fields: ["userId", "isDefault"] },
        { fields: ["isActive"] },
      ],
      hooks: {
        // Ensure only one default payment method per user
        beforeSave: async (paymentMethod, options) => {
          if (paymentMethod.isDefault) {
            await sequelize.models.PaymentMethod.update(
              { isDefault: false },
              {
                where: {
                  userId: paymentMethod.userId,
                  id: { [sequelize.Sequelize.Op.ne]: paymentMethod.id },
                },
                transaction: options.transaction,
              },
            );
          }
        },
      },
    },
  );

  return PaymentMethod;
};
