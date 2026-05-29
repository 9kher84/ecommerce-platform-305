const { Rating, User, Deal, Notification } = require("../sequelize_setup");
const asyncHandler = require("express-async-handler");

/**
 * @desc    إنشاء تقييم جديد (بعد اكتمال الصفقة)
 * @route   POST /api/ratings
 * @access  محمي
 */
exports.createRating = asyncHandler(async (req, res) => {
  const { dealId, rating, comment } = req.body;
  const raterId = req.user.id;

  // 1. التحقق من وجود الصفقة
  const deal = await Deal.findByPk(dealId);
  if (!deal) {
    res.status(404);
    throw new Error("الصفقة غير موجودة.");
  }

  // 2. التحقق من أن المستخدم طرف في الصفقة
  if (deal.sellerId !== raterId && deal.buyerId !== raterId) {
    res.status(403);
    throw new Error("غير مصرح لك بتقييم هذه الصفقة.");
  }

  // 3. التحقق من حالة الصفقة (يجب أن تكون delivered)
  if (deal.status !== "delivered") {
    res.status(400);
    throw new Error("لا يمكن التقييم إلا بعد اكتمال الصفقة (delivered).");
  }

  // 4. تحديد المستخدم الذي يتم تقييمه
  const ratedUserId = deal.sellerId === raterId ? deal.buyerId : deal.sellerId;

  // 5. التحقق من عدم وجود تقييم سابق لنفس الصفقة من نفس المستخدم
  const existingRating = await Rating.findOne({
    where: { dealId, raterId },
  });

  if (existingRating) {
    res.status(400);
    throw new Error("لقد قمت بتقييم هذه الصفقة مسبقاً.");
  }

  // 6. إنشاء التقييم
  const newRating = await Rating.create({
    dealId,
    raterId,
    ratedUserId,
    rating,
    comment,
  });

  // 7. إرسال إشعار للمستخدم الذي تم تقييمه
  await Notification.create({
    recipientId: ratedUserId,
    message: `لقد تلقيت تقييماً جديداً (${rating}/5) على صفقتك.`,
    entityType: "rating",
    entityId: newRating.id,
  });

  res.status(201).json({
    success: true,
    message: "تم إرسال التقييم بنجاح.",
    rating: newRating,
  });
});

/**
 * @desc    جلب تقييمات مستخدم معين
 * @route   GET /api/users/:userId/ratings
 * @access  عام
 */
exports.getUserRatings = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const ratings = await Rating.findAll({
    where: { ratedUserId: userId, isHidden: false },
    include: [
      { model: User, as: "rater", attributes: ["id", "name"] }, // Assuming association exists
    ],
    order: [["createdAt", "DESC"]],
  });

  // حساب متوسط التقييم
  const count = ratings.length;
  const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
  const average = count > 0 ? (sum / count).toFixed(1) : 0;

  res.status(200).json({
    success: true,
    count,
    average,
    ratings,
  });
});
