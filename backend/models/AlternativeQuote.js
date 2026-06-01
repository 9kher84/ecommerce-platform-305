module.exports = (sequelize, DataTypes) => {
  const AlternativeQuote = sequelize.define(
    "AlternativeQuote",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      // ============================================================
      // RELATIONSHIPS
      // ============================================================
      purchaseRequestId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "purchase_requests",
          key: "id",
        },
        comment: "The original purchase request",
      },

      buyerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
        comment: "Buyer requesting alternative quote",
      },

      originalQuoteId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "price_quotes",
          key: "id",
        },
        comment: "The accepted quote being replaced",
      },

      alternativeSellerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
        comment: "New seller being approached",
      },

      // ============================================================
      // REQUEST DETAILS
      // ============================================================
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Why buyer wants alternative quote",
      },

      // ============================================================
      // STATUS
      // ============================================================
      status: {
        type: DataTypes.ENUM(
          "pending", // Sent to alternative seller
          "accepted", // Alternative seller accepted
          "rejected", // Alternative seller rejected
          "expired", // No response within timeframe
        ),
        defaultValue: "pending",
        allowNull: false,
      },

      // ============================================================
      // RESPONSE
      // ============================================================
      alternativeQuoteId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "price_quotes",
          key: "id",
        },
        comment: "New quote submitted by alternative seller",
      },

      respondedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: "When this request expires (24-48 hours typically)",
      },
    },
    {
      tableName: "alternative_quotes",
      timestamps: true,
      indexes: [
        { fields: ["purchaseRequestId"] },
        { fields: ["buyerId"] },
        { fields: ["alternativeSellerId"] },
        { fields: ["status"] },
      ],
      hooks: {
        beforeCreate: async (altQuote) => {
          // Auto-set expiry (48 hours from now)
          if (!altQuote.expiresAt) {
            const expiryDate = new Date();
            expiryDate.setHours(expiryDate.getHours() + 48);
            altQuote.expiresAt = expiryDate;
          }
        },
      },
    },
  );

  // Instance methods
  AlternativeQuote.prototype.isExpired = function () {
    if (!this.expiresAt) return false;
    return new Date() > new Date(this.expiresAt);
  };

  return AlternativeQuote;
};
