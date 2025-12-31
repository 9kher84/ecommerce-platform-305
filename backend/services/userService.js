const { User, PurchaseRequest, PriceQuote } = require('../sequelize_setup');

/**
 * UserService
 * خدمة المستخدمين - توفر عمليات القراءة المتعلقة بالمستخدمين
 */
class UserService {
    /**
     * الحصول على الملف الشخصي الكامل للمستخدم
     * @param {string} id - معرف المستخدم
     * @returns {Promise<User>} بيانات المستخدم
     */
    static async getUserProfile(id) {
        return await User.findByPk(id, {
            attributes: [
                'id',
                'name',
                'email',
                'role',
                'subscriptionTier',
                'rank',
                'isActive',
                'createdAt',
                'phone'
            ]
        });
    }

    /**
     * الحصول على بيانات المستخدم بواسطة المعرف
     * @param {string} id - معرف المستخدم
     * @returns {Promise<User>} بيانات المستخدم الأساسية
     */
    static async getUserById(id) {
        return await User.findByPk(id, {
            attributes: ['id', 'name', 'email', 'role', 'subscriptionTier', 'rank']
        });
    }

    /**
     * الحصول على المستخدم بواسطة البريد الإلكتروني
     * @param {string} email - البريد الإلكتروني
     * @returns {Promise<User>} بيانات المستخدم
     */
    static async getUserByEmail(email) {
        return await User.findOne({
            where: { email },
            attributes: ['id', 'name', 'email', 'role', 'subscriptionTier', 'rank', 'isActive']
        });
    }

    /**
     * الحصول على إحصائيات المستخدم
     * @param {string} userId - معرف المستخدم
     * @returns {Promise<Object>} إحصائيات المستخدم
     */
    static async getUserStats(userId) {
        const user = await User.findByPk(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const stats = {
            requestsCount: 0,
            quotesCount: 0,
            rank: user.rank
        };

        if (user.role === 'buyer') {
            stats.requestsCount = await PurchaseRequest.count({
                where: { buyerId: userId }
            });
        }

        if (user.role === 'seller') {
            stats.quotesCount = await PriceQuote.count({
                where: { sellerId: userId }
            });
        }

        return stats;
    }
}

module.exports = UserService;
