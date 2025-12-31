// C:\Users\s9khr\sasasa\ecommerce-platform\backend\middleware\adminMiddleware.js
const dotenv = require('dotenv');
dotenv.config();

// دالة للتحقق من أن المستخدم هو المالك (بالـ UUID)
const isOwner = (req, res, next) => {
    const user = req.user;

    if (!user) {
        return res.status(401).json({ error: 'غير مصرح' });
    }

    if (user.id === process.env.OWNER_ID) {
        return next();
    }

    // 🔥 التحقق البديل: إذا كان role = 'owner'
    if (user.role === 'owner') {
        return next();
    }

    return res.status(403).json({ error: 'هذا الإجراء مسموح للمالك فقط' });
};

// دالة للتحقق من أن المستخدم أدمن
const isAdmin = (req, res, next) => {
    const user = req.user;

    if (!user) {
        return res.status(401).json({ error: 'غير مصرح' });
    }

    // المالك يعتبر أدمن
    if (user.id === process.env.OWNER_ID || user.role === 'owner') {
        return next();
    }

    // تحقق من isAdmin
    if (user.isAdmin) {
        return next();
    }

    return res.status(403).json({ error: 'هذا الإجراء مسموح للأدمنز فقط' });
};

// دالة للتحقق من صلاحية محددة
const hasPermission = (permission) => {
    return (req, res, next) => {
        const user = req.user;

        if (!user) {
            return res.status(401).json({ error: 'غير مصرح' });
        }

        // المالك لديه كل الصلاحيات
        if (user.id === process.env.OWNER_ID || user.role === 'owner') {
            return next();
        }

        // تحقق من isAdmin
        if (!user.isAdmin) {
            return res.status(403).json({ error: 'ليس لديك صلاحيات إدارية' });
        }

        // تحقق من الصلاحية المحددة
        // افترض أن adminPermissions هو مصفوفة من الصلاحيات
        const permissions = user.adminPermissions || [];

        if (permissions.includes(permission) || permissions.includes('all')) {
            return next();
        }

        return res.status(403).json({
            error: `ليس لديك صلاحية: ${permission}`
        });
    };
};

module.exports = {
    isOwner,
    isAdmin,
    hasPermission
};