/**
 * UserPolicy
 * Pure function to determine access to User resources.
 * 
 * Rules:
 * 1. Read:
 *    - Self (Subject === Resource) -> YES
 *    - Admin/Manager (RBAC) -> YES (if Context Matches)
 * 2. Update:
 *    - Self -> YES (Restricted fields handled by Controller/Validation)
 *    - Admin -> YES (Context Match)
 * 3. Delete:
 *    - Admin Only -> YES (Context Match usually Global/Platform Admin)
 * 
 * @param {Object} user - The actor (Principal)
 * @param {Object} resource - The target user
 * @param {string} action - view, update, delete, manage_roles
 */
const UserPolicy = (user, resource, action) => {
    if (!user) return false;

    // Create Action (No resource)
    if (action === 'create') {
        // Handled by RBAC (MANAGE_USERS) usually.
        // Policy says "Can I create *a* user?" -> Yes if role passed RBAC.
        return true;
    }

    if (!resource) return false;

    // 1. Self Management
    if (user.id === resource.id) {
        if (['view', 'update', 'archive'].includes(action)) return true; // Archive self? Maybe.
        if (action === 'delete') return false; // Self-delete often restricted to prevent accidental logic issues.
    }

    // 2. Context Scope Enforcement (for Admins/Managers)
    if (user.context && user.context.cityId) {
        const targetCityId = resource.context ? resource.context.cityId : null;

        if (targetCityId && user.context.cityId === targetCityId) {
            // City Manager can Suspend/Archive users in their city.
            // Delete might be reserved for Platform Admin.
            if (['suspend', 'archive', 'view', 'update'].includes(action)) return true;
            if (action === 'delete') return false; // City Manager cannot delete users.
        }

        return false;
    }

    // 3. Global Access (Platform Admin)
    // Can do everything including delete.
    return true;
};

module.exports = UserPolicy;
