const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const Delegation = sequelize.define(
    "Delegation",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      fromUserId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: " The Principal (User who owns the right)",
      },
      toUserId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: "The Delegate (User acting on behalf)",
      },
      permissionKey: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Specific permission key or "*" for all',
      },
      scopeType: {
        type: DataTypes.ENUM("global", "city", "team", "resource"),
        defaultValue: "global",
      },
      scopeId: {
        type: DataTypes.STRING, // Can be UUID or special identifier
        allowNull: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      indexes: [
        {
          fields: ["fromUserId", "toUserId", "isActive"],
        },
        {
          fields: ["toUserId", "expiresAt"],
        },
      ],
    },
  );

  return Delegation;
};
