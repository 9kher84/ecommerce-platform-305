const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  return sequelize.define(
    "MembershipTeam",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      membershipId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "OrganizationMemberships",
          key: "id",
        },
      },
      teamId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "teams",
          key: "id",
        },
      },
      roleInTeam: {
        type: DataTypes.STRING,
        defaultValue: "MEMBER", // 'LEAD' | 'MEMBER'
      },
    },
    {
      tableName: "MembershipTeams",
      timestamps: true,
    }
  );
};
