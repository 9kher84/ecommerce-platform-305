const { User, Role, Permission } = require('../sequelize_setup');

class RBACService {
    /**
     * Checks if a user has a specific permission key.
     * @param {string} userId - UUID of the user.
     * @param {string} permissionKey - Key of the permission (e.g., 'MANAGE_USERS').
     * @returns {Promise<boolean>}
     */
    static async hasPermission(userId, permissionKey) {
        if (!userId || !permissionKey) return false;

        try {
            const user = await User.findByPk(userId, {
                include: [{
                    model: Role,
                    as: 'roles',
                    include: [{
                        model: Permission,
                        as: 'permissions',
                        where: { key: permissionKey },
                        required: true // Inner join: only return roles that HAVE this permission
                    }],
                    required: true // Inner join: only return users who have roles
                }]
            });

            // If user is found with the nested include, it means they have at least one role with the permission.
            return !!user;
        } catch (error) {
            console.error(`RBAC Check Failed for user ${userId} / perm ${permissionKey}:`, error);
            return false; // Fail safe
        }
    }

    /**
     * Checks if a user has ANY of the provided permission keys.
     * @param {string} userId 
     * @param {string[]} permissionKeys 
     */
    static async hasAnyPermission(userId, permissionKeys) {
        // Implementation similar to above with Op.in, or iterative.
        // For Phase 1, we stick to basic single check or optimize later.
        // Let's implement robustly.
        if (!userId || !permissionKeys || permissionKeys.length === 0) return false;

        try {
            const { Op } = require('sequelize');
            const user = await User.findByPk(userId, {
                include: [{
                    model: Role,
                    as: 'roles',
                    include: [{
                        model: Permission,
                        as: 'permissions',
                        where: { key: { [Op.in]: permissionKeys } },
                        required: true
                    }],
                    required: true
                }]
            });
            return !!user;
        } catch (error) {
            console.error('RBAC Any Check Failed:', error);
            return false;
        }
    }
}

module.exports = RBACService;
