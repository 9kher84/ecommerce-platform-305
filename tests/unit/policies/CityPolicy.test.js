const CityPolicy = require('../../../backend/policies/CityPolicy');

describe('CityPolicy (Pure)', () => {
    const admin = { id: 'admin-1' };
    const cityManager = { id: 'cm-1', context: { cityId: 'city-1' } };
    const user = { id: 'u-1' };

    const city1 = { id: 'city-1', name: 'Riyadh' };
    const city2 = { id: 'city-2', name: 'Jeddah' };

    test('should allow view for all', () => {
        expect(CityPolicy(user, city1, 'view')).toBe(true);
    });

    test('should allow Admin to update', () => {
        expect(CityPolicy(admin, city1, 'update')).toBe(true);
    });

    test('should allow City Manager to update OWN city', () => {
        expect(CityPolicy(cityManager, city1, 'update')).toBe(true);
    });

    test('should deny City Manager updating OTHER city', () => {
        expect(CityPolicy(cityManager, city2, 'update')).toBe(false);
    });

    // ---------------------------------------------------------
    // New Action Tests (Phase 6)
    // ---------------------------------------------------------
    test('should allow Global Admin to delete/suspend', () => {
        expect(CityPolicy(admin, city1, 'delete')).toBe(true);
        expect(CityPolicy(admin, city1, 'suspend')).toBe(true);
    });

    test('should deny City Manager from deleting/suspending City (even their own)', () => {
        // City Manager manages settings (update), but cannot destroy the city infra.
        expect(CityPolicy(cityManager, city1, 'delete')).toBe(false);
        expect(CityPolicy(cityManager, city1, 'suspend')).toBe(false);
    });
});
