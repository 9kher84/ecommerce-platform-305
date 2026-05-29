module.exports = (sequelize, DataTypes) => {
  const WithdrawalLog = sequelize.define(
    "WithdrawalLog",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },

      // ============================================================
      // USER INFORMATION
      // ============================================================
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        comment: "User who withdrew",
      },

      userRole: {
        type: DataTypes.ENUM("buyer", "seller"),
        allowNull: false,
      },

      subscriptionTier: {
        type: DataTypes.ENUM("free", "plan_a", "plan_b"),
        allowNull: false,
      },

      // ============================================================
      // WITHDRAWAL DETAILS
      // ============================================================
      entityType: {
        type: DataTypes.ENUM("purchase_request", "price_quote", "deal"),
        allowNull: false,
      },

      entityId: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: "ID of the entity (request/quote/deal)",
      },

      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "User-provided reason for withdrawal",
      },

      // ============================================================
      // PENALTY CALCULATION
      // ============================================================
      countsAs: {
        type: DataTypes.DECIMAL(3, 2),
        defaultValue: 1.0,
        comment:
          "Penalty weight: Free=1.0, Plan A=0.33, Plan B=0.0 (buyer) or 0.1 (seller)",
      },

      // ============================================================
      // TRACKING PERIOD
      // ============================================================
      periodStart: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: "Start of 30-day tracking period (for sellers)",
      },

      periodEnd: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: "End of 30-day tracking period",
      },
    },
    {
      tableName: "withdrawal_logs",
      timestamps: true,
      indexes: [
        { fields: ["userId"] },
        { fields: ["userRole"] },
        { fields: ["createdAt"] },
        { fields: ["userId", "createdAt"] }, // For calculating totals
        { fields: ["periodStart", "periodEnd"] }, // For 30-day window queries
      ],
    },
  );

  // Class methods
  WithdrawalLog.getTotalWithdrawals = async function (userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = await this.findAll({
      where: {
        userId,
        createdAt: {
          [sequelize.Sequelize.Op.gte]: startDate,
        },
      },
    });

    // Sum up the weighted penalties
    return logs.reduce((total, log) => total + parseFloat(log.countsAs), 0);
  };

  return WithdrawalLog;
};
