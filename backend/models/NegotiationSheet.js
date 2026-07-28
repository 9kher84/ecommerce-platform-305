module.exports = (sequelize, DataTypes) => {
  const NegotiationSheet = sequelize.define(
    "NegotiationSheet",
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
      initiatorPartyId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      decision: {
        type: DataTypes.ENUM("PROPOSAL", "COUNTER", "REQUEST_CHANGE", "INFORMATION", "FINAL", "WITHDRAW"),
        allowNull: false,
      },
      terms: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      changeSet: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      notes: {
        type: DataTypes.STRING(300),
        allowNull: true,
      },
      validUntil: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      proposalScore: {
        type: DataTypes.FLOAT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("PENDING", "SUPERSEDED", "ACCEPTED", "REJECTED", "EXPIRED", "WITHDRAWN"),
        defaultValue: "PENDING",
      },
    },
    {
      paranoid: true,
      timestamps: true,
    }
  );

  return NegotiationSheet;
};
