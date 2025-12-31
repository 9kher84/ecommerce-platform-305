const UserPolicy = require('../../../backend/policies/UserPolicy');

describe('UserPolicy (Pure)', () => {
    const admin = { id: 'admin-1', role: 'admin' };
    const cityManager = { id: 'cm-1', role: 'city_manager', context: { cityId: 'city-1' } };
    const userA = { id: 'u-1', context: { cityId: 'city-1' } };
    const userB = { id: 'u-2', context: { cityId: 'city-2' } };

    test('should allow self update', () => {
        expect(UserPolicy(userA, userA, 'update')).toBe(true);
    });

    test('should deny user updating another', () => {
        expect(UserPolicy(userA, userB, 'update')).toBe(false);
    });

    test('should allow Global Admin to update anyone', () => {
        expect(UserPolicy(admin, userA, 'update')).toBe(true);
    });

    test('should allow City Manager to update user in Same Context', () => {
        // Mock resource structure: needs context loaded
        expect(UserPolicy(cityManager, userA, 'update')).toBe(true);
    });

    test('should deny City Manager updating user in Different Context', () => {
        expect(UserPolicy(cityManager, userB, 'update')).toBe(false);
    });

    // ---------------------------------------------------------
    // New Action Tests (Phase 6)
    // ---------------------------------------------------------
    test('should allow Global Admin to delete', () => {
        expect(UserPolicy(admin, userA, 'delete')).toBe(true);
    });

    test('should deny City Manager from deleting user (even in context)', () => {
        expect(UserPolicy(cityManager, userA, 'delete')).toBe(false);
    });

    test('should allow City Manager to suspend/archive in Same Context', () => {
        expect(UserPolicy(cityManager, userA, 'suspend')).toBe(true);
        expect(UserPolicy(cityManager, userA, 'archive')).toBe(true);
    });

    test('should deny City Manager to suspend/archive in Different Context', () => {
        expect(UserPolicy(cityManager, userB, 'suspend')).toBe(false);
    });
});
