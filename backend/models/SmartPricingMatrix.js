module.exports = (sequelize, DataTypes) => {
  return sequelize.define("SmartPricingMatrix", {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    minQuantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    maxQuantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    deliveryCost: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    cityTarget: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
  });
};
