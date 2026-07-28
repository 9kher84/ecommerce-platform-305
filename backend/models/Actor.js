const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define(
    "Actor",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      actorType: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "HUMAN_USER", // 'HUMAN_USER' | 'USER_AGENT' | 'ORGANIZATION_AGENT' | 'PLATFORM_AGENT' | 'WORKFLOW' | 'EXTERNAL_SERVICE'
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      membershipId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "OrganizationMemberships", key: "id" },
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "Users", key: "id" },
      },
      organizationId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: "organizations", key: "id" },
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "ACTIVE", // 'ACTIVE' | 'PAUSED' | 'REVOKED'
      },
    },
    {
      tableName: "Actors",
      timestamps: true,
    }
  );
};
