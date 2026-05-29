// backend/models/Rating.js
module.exports = (sequelize, DataTypes) => {
  const Rating = sequelize.define(
    "Rating",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      dealId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: "الرابط مع الصفقة",
      },
      raterId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: "المستخدم الذي قام بالتقييم",
      },
      ratedUserId: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: "المستخدم الذي تم تقييمه",
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      isHidden: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "يمكن للمشرف إخفاء التعليقات غير اللائقة",
      },
    },
    {
      tableName: "ratings",
      timestamps: true,
      indexes: [
        { fields: ["dealId"] },
        { fields: ["raterId"] },
        { fields: ["ratedUserId"] },
      ],
    },
  );

  return Rating;
};
