const jwt = require("jsonwebtoken");
const { User } = require("../../../sequelize_setup");

// استيراد جميع الخدمات
const RequestService = require("../../../services/requestService");
const UserService = require("../../../services/userService");
const DashboardService = require("../../../services/dashboardService");
const QuoteService = require("../../../services/quoteService");

/**
 * GraphQL Context Function
 * دالة السياق - تقوم بالتحقق من المصادقة وتمرير المستخدم والخدمات إلى الـ Resolvers
 *
 * @param {Object} params - معاملات السياق
 * @param {Object} params.req - كائن الطلب من Express
 * @returns {Object} كائن السياق الذي يحتوي على المستخدم والخدمات
 */
const context = async ({ req }) => {
  // محاولة الحصول على المستخدم من الـ middleware (إذا كان موجوداً)
  let user = req.user || null;

  // إذا لم يكن هناك مستخدم من الـ middleware، نحاول التحقق من الـ token
  if (!user) {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (token) {
      try {
        // فك تشفير الـ token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // جلب بيانات المستخدم الكاملة من قاعدة البيانات
        user = await User.findByPk(decoded.id, {
          attributes: [
            "id",
            "name",
            "email",
            "role",
            "subscriptionTier",
            "rank",
            "isActive",
            "createdAt",
          ],
        });

        // التأكد من أن المستخدم نشط
        if (user && !user.isActive) {
          user = null;
        }
      } catch (error) {
        // Token غير صالح أو منتهي الصلاحية
        console.error("JWT verification failed:", error.message);
        user = null;
      }
    }
  }

  // تحويل المستخدم إلى كائن عادي (plain object) إذا كان Sequelize model
  const userObject = user
    ? {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        subscriptionTier: user.subscriptionTier,
        rank: user.rank,
        isActive: user.isActive,
        createdAt: user.createdAt,
      }
    : null;

  // إرجاع كائن السياق مع المستخدم وجميع الخدمات
  return {
    user: userObject,
    services: {
      RequestService,
      UserService,
      DashboardService,
      QuoteService,
    },
  };
};

module.exports = { context };
