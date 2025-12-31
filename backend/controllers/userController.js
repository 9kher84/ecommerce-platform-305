const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const { User } = require('../sequelize_setup');

// ----------------------------------------------------------------------
// 1. الوظائف الأساسية (جلب وتحديث الملف الشخصي)
// ----------------------------------------------------------------------

/**
 * @desc   جلب الملف الشخصي للمستخدم الحالي
 * @route  GET /api/users/profile
 * @access محمي
 */
exports.getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password', 'emailVerificationToken', 'newEmail'] }
    });

    if (user) {
        res.status(200).json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                mobile: user.mobile,
                businessName: user.businessName,
                jobTitle: user.jobTitle,
                commercialRegister: user.commercialRegister,
                city: user.city,
                role: user.role,
                subscriptionTier: user.subscriptionTier,
                registrationDate: user.createdAt,
                publishedRequestsCount: user.publishedRequestsCount,
                buyerRating: user.buyerRating,
                completedDealsCount: user.completedDealsCount,
                notificationSettings: user.notificationSettings,
                rank: user.rank
            }
        });
    } else {
        res.status(404);
        throw new Error('لم يتم العثور على المستخدم.');
    }
});

/**
 * @desc   تحديث الملف الشخصي للمستخدم الحالي
 * @route  PUT /api/users/profile
 * @access محمي
 */
exports.updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.user.id);

    // استدعاء الـ DTO لمرة واحدة فقط لتطهير البيانات (Sanitization)
    const UserUpdateDTO = require('../dto/UserUpdateDTO');
    const updateDto = new UserUpdateDTO(req.body);

    // تنفيذ الفحص الأمني ومنع تمرير أي حقول غير مصرح بها (الخط الأحمر للقيادة)
    const { valid, sanitizedData, illegalFields } = updateDto.validate();

    if (user) {
        // تحديث الحقول المسموح بها فقط بعد التطهير
        if (sanitizedData.name) user.name = sanitizedData.name;
        if (sanitizedData.mobile) user.mobile = sanitizedData.mobile;
        if (sanitizedData.businessName) user.businessName = sanitizedData.businessName;
        if (sanitizedData.jobTitle) user.jobTitle = sanitizedData.jobTitle;
        if (sanitizedData.commercialRegister) user.commercialRegister = sanitizedData.commercialRegister;
        if (sanitizedData.city) user.city = sanitizedData.city;

        // ... تكملة منطق حفظ البيانات وحماية كلمة المرور
        await user.save();

        res.status(200).json({
            success: true,
            message: 'تم تحديث الملف الشخصي بنجاح وتطبيق فلاتر التطهير المركزية.'
        });
    } else {
        res.status(404);
        throw new Error('المستخدم غير موجود.');
    }
});


// ----------------------------------------------------------------------
// 2. وظائف المسؤول (Admin) - إدارة جميع المستخدمين
// ----------------------------------------------------------------------

/**
 * @desc   جلب جميع المستخدمين
 * @route  GET /api/users/admin/all
 * @access محمي / مقيد للمسؤولين فقط
 */
exports.getAllUsers = asyncHandler(async (req, res) => {
    const users = await User.findAll({
        attributes: { exclude: ['password'] },
        order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
        success: true,
        count: users.length,
        users
    });
});

/**
 * @desc   جلب مستخدم بواسطة ID
 * @route  GET /api/users/admin/:id
 * @access محمي / مقيد للمسؤولين فقط
 */
exports.getUserById = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.params.id, {
        attributes: { exclude: ['password'] }
    });

    if (user) {
        res.status(200).json({ success: true, user });
    } else {
        res.status(404);
        throw new Error('لم يتم العثور على المستخدم.');
    }
});

/**
 * @desc   تحديث مستخدم بواسطة ID (تغيير الدور، الحظر، الاشتراك)
 * @route  PUT /api/users/admin/:id
 * @access محمي / مقيد للمسؤولين فقط
 */
exports.updateUserById = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.params.id);
    const { name, email, role, isActive, subscriptionTier } = req.body;

    if (user) {
        user.name = name || user.name;
        user.email = email || user.email;

        if (req.user.role === 'super_admin' && role) {
            user.role = role;
        }

        if (isActive !== undefined) {
            if (user.id === req.user.id) {
                res.status(400);
                throw new Error('لا يمكنك تعطيل حسابك الخاص.');
            }
            user.isActive = isActive;
        }

        if (subscriptionTier) {
            if (['free', 'plan_a', 'plan_b'].includes(subscriptionTier)) {
                user.subscriptionTier = subscriptionTier;
            } else {
                res.status(400);
                throw new Error('خطة اشتراك غير صالحة');
            }
        }

        await user.save();

        res.status(200).json({
            success: true,
            message: `تم تحديث المستخدم ${user.id} بنجاح.`,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive,
                subscriptionTier: user.subscriptionTier
            }
        });

    } else {
        res.status(404);
        throw new Error('لم يتم العثور على المستخدم.');
    }
});

/**
 * @desc   حذف مستخدم بواسطة ID
 * @route  DELETE /api/users/admin/:id
 * @access محمي / مقيد للمسؤولين فقط
 */
exports.deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findByPk(req.params.id);

    if (user) {
        if (user.role === 'admin' && req.user.role !== 'super_admin') {
            res.status(403);
            throw new Error('غير مصرح لك: المسؤولون العاديون لا يمكنهم حذف مسؤولين آخرين.');
        }

        await user.destroy();
        res.status(200).json({ success: true, message: 'تم حذف المستخدم بنجاح.' });
    } else {
        res.status(404);
        throw new Error('لم يتم العثور على المستخدم.');
    }
});