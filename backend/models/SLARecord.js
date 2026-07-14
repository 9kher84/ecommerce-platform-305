module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "SLARecord",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      referenceType: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      referenceId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      startedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      deadlineAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("ACTIVE", "COMPLETED", "BREACHED"),
        defaultValue: "ACTIVE",
      },
    },
    {
      indexes: [
        { fields: ["referenceType", "referenceId"] },
        { fields: ["status"] }
      ],
    }
  );
};
