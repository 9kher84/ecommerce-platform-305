module.exports = (sequelize, DataTypes) => {
  const Escrow = sequelize.define(
    "Escrow",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      awardId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
      },
      buyerId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      sellerId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(3),
        allowNull: false,
        defaultValue: 'SAR',
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending_funding',
      },
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
    },
    {
      timestamps: true,
    }
  );

  return Escrow;
};
