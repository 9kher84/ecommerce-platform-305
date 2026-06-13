const { User, Role, Permission } = require("../sequelize_setup");

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
      // --- TEMP BYPASS INJECTED AS REQUESTED ---
      const userObj = await User.findByPk(userId, { attributes: ['role'] });
      if (userObj) {
        console.log("RBAC DEBUG ROLE:", userObj.role);
        console.log("RBAC DEBUG PERMISSION:", permissionKey);
        
        if (userObj.role === 'seller' && permissionKey === 'VIEW_QUOTES') {
          console.log("RBAC TEMP BYPASS ACTIVATED");
          return true;
        }
      }
      // ---------------------------------------

      console.log(`DEBUG: Checking perm '${permissionKey}' for user ${userId}`);
      
      // 1. Try DB-based RBAC
      const user = await User.findByPk(userId, {
        include: [
          {
            model: Role,
            as: "roles",
            include: [
              {
                model: Permission,
                as: "permissions",
                where: { key: permissionKey },
                required: true, // Inner join: only return roles that HAVE this permission
              },
            ],
            required: true, // Inner join: only return users who have roles
          },
        ],
      });

      if (user) return true;
      
      // 2. Fallback to static roles based on user.role enum
      const fallbackUser = await User.findByPk(userId, { attributes: ['role'] });
      if (!fallbackUser) return false;
      
      const role = fallbackUser.role;
      const staticPermissions = {
        buyer: ["CREATE_REQUEST", "VIEW_REQUESTS", "ACCEPT_QUOTE", "VIEW_QUOTES", "MANAGE_PROFILE"],
        seller: ["VIEW_REQUESTS", "CREATE_QUOTE", "VIEW_QUOTES", "MANAGE_PROFILE"],
        admin: ["CREATE_REQUEST", "VIEW_REQUESTS", "CREATE_QUOTE", "ACCEPT_QUOTE", "VIEW_QUOTES", "MANAGE_USERS", "MANAGE_PROFILE"],
        super_admin: ["CREATE_REQUEST", "VIEW_REQUESTS", "CREATE_QUOTE", "ACCEPT_QUOTE", "VIEW_QUOTES", "MANAGE_USERS", "MANAGE_PROFILE"],
        marketer: ["VIEW_REQUESTS", "VIEW_QUOTES", "MANAGE_PROFILE"]
      };

      if (staticPermissions[role] && staticPermissions[role].includes(permissionKey)) {
        console.warn(`[RBAC Fallback] Granted '${permissionKey}' via static role '${role}' for user ${userId}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error(
        `RBAC Check Failed for user ${userId} / perm ${permissionKey}:`,
        error,
      );
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
      const { Op } = require("sequelize");
      const user = await User.findByPk(userId, {
        include: [
          {
            model: Role,
            as: "roles",
            include: [
              {
                model: Permission,
                as: "permissions",
                where: { key: { [Op.in]: permissionKeys } },
                required: true,
              },
            ],
            required: true,
          },
        ],
      });
      return !!user;
    } catch (error) {
      console.error("RBAC Any Check Failed:", error);
      return false;
    }
  }
}

module.exports = RBACService;
