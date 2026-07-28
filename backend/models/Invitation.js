const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define(
    "Invitation",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      organizationId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: "organizations", key: "id" },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      token: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      role: {
        type: DataTypes.STRING,
        defaultValue: "EMPLOYEE",
      },
      initialTeams: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "PENDING", // 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED'
      },
    },
    {
      tableName: "Invitations",
      timestamps: true,
      indexes: [
        { fields: ["organizationId"] },
        { fields: ["email"] },
        { fields: ["token"] }
      ]
    }
  );
};
