/**
 * CityPolicy
 * Pure function to determine access to City resources.
 * 
 * Rules:
 * - View: Public usually? Or Authenticated?
 * - Manage (Update/Create): Global Admin Only usually.
 * - City Manager: Can they edit their own city? Maybe.
 */
const CityPolicy = (user, resource, action) => {
    if (!user) return false;

    if (action === 'view') return true; // Public/Shared info

    if (action === 'create' && !resource) return true; // RBAC 'MANAGE_LOCATIONS'

    if (!resource) return false;

    // Manage (Update/Create)
    if (['update', 'manage'].includes(action)) {
        // 1. Context Match (City Manager editing their City settings)
        if (user.context && user.context.cityId) {
            return user.context.cityId === resource.id;
        }
        // 2. Global Admin
        return true;
    }

    // High Level Actions (Delete, Suspend, Archive) -> Global Admin Only
    if (['delete', 'suspend', 'archive'].includes(action)) {
        if (user.context && user.context.cityId) return false; // City Manager cannot delete city
        return true; // Global Admin
    }

    return false;
};

module.exports = CityPolicy;
