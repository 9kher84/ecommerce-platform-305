import { User } from '../../domain/entities/User';

/**
 * Role Manager
 * Handles Role-Based Access Control (RBAC) for the mobile application.
 */

export enum Permission {
    VIEW_DASHBOARD = 'view_dashboard',
    MANAGE_USERS = 'manage_users',
    MANAGE_PAYMENTS = 'manage_payments',
    CREATE_POST = 'create_post',
    VIEW_ANALYTICS = 'view_analytics',
    ACCESS_ADMIN_PANEL = 'access_admin_panel',
}

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
    super_admin: Object.values(Permission), // All permissions
    admin: [
        Permission.VIEW_DASHBOARD,
        Permission.MANAGE_USERS,
        Permission.VIEW_ANALYTICS,
        Permission.ACCESS_ADMIN_PANEL,
    ],
    seller: [
        Permission.VIEW_DASHBOARD,
        Permission.CREATE_POST,
        Permission.VIEW_ANALYTICS,
    ],
    buyer: [
        Permission.VIEW_DASHBOARD,
    ],
};

export const RoleManager = {
    /**
     * Check if a user has a specific permission.
     */
    hasPermission(user: User, permission: Permission): boolean {
        const userPermissions = ROLE_PERMISSIONS[user.role] || [];
        return userPermissions.includes(permission);
    },

    /**
     * Check if a user has ANY of the required permissions.
     */
    hasAnyPermission(user: User, permissions: Permission[]): boolean {
        const userPermissions = ROLE_PERMISSIONS[user.role] || [];
        return permissions.some(p => userPermissions.includes(p));
    },

    /**
     * Get all permissions for a user role.
     */
    getPermissions(role: string): Permission[] {
        return ROLE_PERMISSIONS[role] || [];
    }
};
