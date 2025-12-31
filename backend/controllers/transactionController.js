const { Transaction, Post, Offer, User } = require('../sequelize_setup');
const asyncHandler = require('express-async-handler');
const { Op } = require('sequelize');

/**
 * @desc    إغلاق صفقة وقبول أعلى عرض على منشور
 * @route   POST /api/transactions/finalize/:postId
 * @access  محمي (للبائع فقط)
 */
exports.finalizeTransaction = asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const sellerId = req.user.id;

    // 1. جلب المنشور والتحقق من الملكية
    const post = await Post.findByPk(postId, {
        include: [
            { model: User, as: 'seller', attributes: ['id', 'name', 'email', 'phone'] }
        ]
    });

    if (!post) {
        res.status(404);
        throw new Error('لم يتم العثور على المنشور.');
    }

    // التحقق من أن المستخدم الحالي هو البائع
    if (post.sellerId !== sellerId) {
        res.status(403);
        throw new Error('غير مصرح لك: يمكنك فقط إغلاق صفقات منشوراتك.');
    }

    // التحقق من حالة المنشور
    if (post.status !== 'active') {
        res.status(400);
        throw new Error('لا يمكن إغلاق صفقة: المنشور ليس في حالة نشطة.');
    }

    // 2. التحقق من وجود عرض فائز
    const highestOfferAmount = post.currentHighestOffer;
    const winningBuyerId = post.highestOfferBuyerId;

    if (!highestOfferAmount || !winningBuyerId || highestOfferAmount === post.startingPrice) {
        res.status(400);
        throw new Error('لا يمكن إغلاق الصفقة: يجب أن يكون هناك عرض مقبول (أعلى من سعر البداية).');
    }

    // 3. جلب بيانات المشتري الفائز
    const buyer = await User.findByPk(winningBuyerId, {
        attributes: ['id', 'name', 'email', 'phone']
    });

    if (!buyer) {
        res.status(500);
        throw new Error('خطأ في النظام: لم يتم العثور على بيانات المشتري الفائز.');
    }

    // 4. تنفيذ المعاملة (يفضل استخدام Sequelize Transaction لضمان الذرية)
    // NOTE: نحن نتجاوز Sequelize Transaction لتبسيط الكود، لكن هذا الجزء حرج.

    // أ. تحديث حالة المنشور إلى مُباع
    post.status = 'sold';
    post.finalPrice = highestOfferAmount;
    post.buyerId = winningBuyerId; // تحديد المشتري النهائي في سجل المنشور
    await post.save();

    // ب. تسجيل الصفقة النهائية
    const transaction = await Transaction.create({
        postId: post.id,
        sellerId: sellerId,
        buyerId: winningBuyerId,
        finalAmount: highestOfferAmount,
    });
    
    // ج. حذف جميع العروض الأخرى (أو يمكن تحديث حالتها إلى 'rejected')
    await Offer.destroy({
        where: { postId: post.id }
    });


    // 5. إرجاع بيانات الصفقة والمعلومات الاتصال
    res.status(200).json({
        success: true,
        message: 'تم إغلاق الصفقة بنجاح. يمكنكم الآن التواصل لإتمام عملية التسليم.',
        transaction: transaction,
        post: {
            id: post.id,
            title: post.title,
            finalPrice: post.finalPrice,
        },
        contactDetails: {
            seller: { id: post.seller.id, name: post.seller.name, phone: post.seller.phone, email: post.seller.email },
            buyer: { id: buyer.id, name: buyer.name, phone: buyer.phone, email: buyer.email }
        }
    });
});

/**
 * @desc    جلب جميع الصفقات (للمسؤول فقط)
 * @route   GET /api/transactions
 * @access  محمي (للمسؤولين)
 */
exports.getAllTransactions = asyncHandler(async (req, res) => {
    const transactions = await Transaction.findAll({
        include: [
            { model: Post, as: 'post', attributes: ['title', 'startingPrice'] },
            { model: User, as: 'seller', attributes: ['name', 'email'] },
            { model: User, as: 'buyer', attributes: ['name', 'email'] }
        ],
        order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ success: true, count: transactions.length, transactions });
});