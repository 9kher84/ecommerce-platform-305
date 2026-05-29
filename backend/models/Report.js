// backend/models/Report.js
module.exports = (sequelize, DataTypes) => {
  const Report = sequelize.define(
    "Report",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      type: {
        type: DataTypes.ENUM(
          "abuse",
          "bug",
          "suggestion",
          "financial",
          "technical",
        ),
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      reporterId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      entityType: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "e.g., deal, user, request",
      },
      entityId: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("pending", "investigating", "resolved", "closed"),
        defaultValue: "pending",
      },
      adminNotes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "reports",
      timestamps: true,
    },
  );

  return Report;
};
