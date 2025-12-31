const dotenv = require('dotenv');
dotenv.config();

// Middleware to check specific admin permission
const checkAdminPermission = (permissionPath) => {
    return async (req, res, next) => {
        try {
            const user = req.user; // Assumes authMiddleware has already run and populated req.user

            if (!user) {
                return res.status(401).json({ error: 'غير مصرح (Not Authenticated)' });
            }

            // 1. Owner always passes
            if (user.id === process.env.OWNER_ID) {
                return next();
            }

            // 2. Check if user is an Admin
            if (!user.isAdmin) {
                return res.status(403).json({
                    error: 'ليس لديك صلاحيات إدارية (Access Denied)'
                });
            }

            // 3. If no specific permission is required (just "is admin"), pass
            if (!permissionPath) {
                return next();
            }

            // 4. Check Granular Permissions
            if (!user.adminPermissions) {
                return res.status(403).json({
                    error: 'حسابك لا يملك أي صلاحيات (No Permissions Assigned)'
                });
            }

            const pathParts = permissionPath.split('.');
            let currentPermission = user.adminPermissions;

            // Navigate through the permission object structure
            for (const part of pathParts) {
                if (currentPermission === undefined || currentPermission === null) {
                    return res.status(403).json({
                        error: `صلاحية غير موجودة: ${permissionPath}`
                    });
                }

                currentPermission = currentPermission[part];
            }

            // If we found a boolean at the end, check if it is true
            if (currentPermission === true) {
                return next();
            } else {
                return res.status(403).json({
                    error: `ليس لديك صلاحية: ${permissionPath}`
                });
            }

        } catch (error) {
            console.error('Admin Auth Error:', error);
            res.status(500).json({ error: 'خطأ في التحقق من الصلاحيات' });
        }
    };
};

// Middleware to check if user is specifically the Owner
const isOwner = (req, res, next) => {
    const user = req.user;

    if (!user) {
        return res.status(401).json({ error: 'غير مصرح' });
    }

    if (user.id === process.env.OWNER_ID) {
        return next();
    }
    return res.status(403).json({ error: 'هذا الإجراء مسموح للمالك فقط' });
};

module.exports = {
    checkAdminPermission,
    isOwner
};
