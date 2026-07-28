module.exports = (sequelize, DataTypes) => {
  const ProcessParty = sequelize.define(
    "ProcessParty",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      commercialProcessId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true, // Nullable for AI agents
      },
      organizationId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      partyRole: {
        type: DataTypes.ENUM("BUYER", "SELLER", "BROKER", "AGENT"),
        allowNull: false,
      },
    },
    {
      paranoid: true,
      timestamps: true,
    }
  );

  return ProcessParty;
};
