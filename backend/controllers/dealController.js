// dealController.js - الإصلاح الكامل مع المحاكاة
const { Deal, Post, User, Offer } = require('../sequelize_setup');
const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');
const { addDealNotificationJob } = require('../queue/dealQueue');

// بيانات محاكاة واقعية للصفقات
const mockDeals = [
    {
        id: 1,
        finalAmount: 1500.00,
        postId: 101,
        offerId: 1,
        sellerId: 8,
        buyerId: 5,
        status: 'agreed',
        createdAt: new Date(),
        updatedAt: new Date(),
        post: { id: 101, title: "شقة فاخرة للبيع في الرياض", status: "active" },
        seller: { id: 8, name: "بائع تجريبي" },
        buyer: { id: 5, name: "مشتري تجريبي" },
        offer: { id: 1, amount: 1500.00, status: "accepted", currency: "SAR" }
    },
    {
        id: 2,
        finalAmount: 2300.50,
        postId: 102,
        offerId: 2,
        sellerId: 12,
        buyerId: 3,
        status: 'paid',
        createdAt: new Date(),
        updatedAt: new Date(),
        post: { id: 102, title: "لابتوب جيمنج للبيع", status: "active" },
        seller: { id: 12, name: "بائع آخر" },
        buyer: { id: 3, name: "مشتري آخر" },
        offer: { id: 2, amount: 2300.50, status: "accepted", currency: "SAR" }
    }
];

/**
 * @desc    جلب الصفقات الخاصة بالمستخدم (مشتري أو بائع)
 * @route   GET /api/deals
 * @access  محمي
 */
exports.getDeals = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    let filteredDeals = [];
    let message = '';

    if (userRole === 'seller' || userRole === 'admin' || userRole === 'super_admin') {
        if (userRole === 'seller') {
            filteredDeals = mockDeals.filter(deal => deal.sellerId === userId);
        } else {
            filteredDeals = mockDeals.filter(deal =>
                deal.sellerId === userId || deal.buyerId === userId
            );
        }
        message = 'قائمة المبيعات والمشتريات (Sales/Purchases)';
    } else if (userRole === 'buyer') {
        filteredDeals = mockDeals.filter(deal => deal.buyerId === userId);
        message = 'قائمة المشتريات (Purchases)';
    } else {
        res.status(403);
        throw new Error('غير مصرح لك: يجب أن تكون بائعاً أو مشترياً لرؤية الصفقات.');
    }

    res.status(200).json({
        success: true,
        count: filteredDeals.length,
        message: message,
        deals: filteredDeals
    });
});

/**
 * @desc    تحديث حالة صفقة معينة
 * @route   PATCH /api/deals/:id/status
 * @access  محمي (يختلف حسب الحالة ومنطق الانتقال)
 */
exports.updateDealStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!status) {
        res.status(400);
        throw new Error('الرجاء تقديم حالة صفقة جديدة (status).');
    }

    const dealIndex = mockDeals.findIndex(d => d.id === parseInt(id));
    if (dealIndex === -1) {
        res.status(404);
        throw new Error('لم يتم العثور على الصفقة.');
    }

    const deal = mockDeals[dealIndex];
    const currentStatus = deal.status;
    let isAllowed = false;
    let errorMessage = '';

    const validTransitions = ['paid', 'delivered'];
    if (!validTransitions.includes(status)) {
        res.status(400);
        throw new Error(`حالة الصفقة غير صالحة: ${status}. الحالات المسموحة هي 'paid' و 'delivered'.`);
    }

    const isAdmin = userRole === 'admin' || userRole === 'super_admin';

    switch (status) {
        case 'paid':
            if (currentStatus === 'agreed') {
                if (deal.sellerId === userId || isAdmin) isAllowed = true;
                else errorMessage = 'غير مصرح لك: فقط البائع (مستلم المال) يمكنه تأكيد الدفع.';
            } else {
                errorMessage = `لا يمكن الانتقال من حالة "${currentStatus}" إلى "مدفوعة". تتطلب حالة "agreed" أولاً.`;
            }
            break;

        case 'delivered':
            if (currentStatus === 'paid') {
                if (deal.buyerId === userId || isAdmin) isAllowed = true;
                else errorMessage = 'غير مصرح لك: فقط المشتري (مستلم المنتج) يمكنه تأكيد التسليم.';
            } else {
                errorMessage = `لا يمكن الانتقال من حالة "${currentStatus}" إلى "تم التسليم". تتطلب حالة "مدفوعة" أولاً.`;
            }
            break;

        default:
            errorMessage = 'حالة الصفقة الجديدة غير معالجة أو غير صالحة.';
    }

    if (!isAllowed) {
        res.status(403);
        throw new Error(errorMessage || 'غير مصرح لك بتغيير حالة الصفقة هذه.');
    }

    // تحديث الحالة
    mockDeals[dealIndex].status = status;
    mockDeals[dealIndex].updatedAt = new Date();

    // محاكاة إرسال الإشعار
    console.log(`🚀 تم تحديث حالة الصفقة ${id} إلى: ${status}`);

    res.status(200).json({
        success: true,
        message: `تم تحديث حالة الصفقة بنجاح إلى: ${status}`,
        deal: {
            id: mockDeals[dealIndex].id,
            status: mockDeals[dealIndex].status,
            updatedAt: mockDeals[dealIndex].updatedAt
        }
    });
});