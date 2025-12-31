const RequestPolicy = require('../../../backend/policies/RequestPolicy');

describe('RequestPolicy (Pure)', () => {
    const owner = { id: 'u-1' };
    const other = { id: 'u-2' };
    const adminGlobal = { id: 'admin-g', role: 'admin' }; // No context
    const cityManager = { id: 'cm-1', role: 'city_manager', context: { cityId: 'city-1' } };

    const request = {
        id: 'r-1',
        userId: 'u-1',
        cityId: 'city-1'
    };

    const requestCrossCity = {
        id: 'r-2',
        userId: 'u-1',
        cityId: 'city-2'
    };

    test('should allow Owner to update/cancel/delete/archive', () => {
        expect(RequestPolicy(owner, request, 'update')).toBe(true);
        expect(RequestPolicy(owner, request, 'cancel')).toBe(true);
        expect(RequestPolicy(owner, request, 'delete')).toBe(true);
        expect(RequestPolicy(owner, request, 'archive')).toBe(true);
    });

    test('should deny Others update/delete', () => {
        expect(RequestPolicy(other, request, 'update')).toBe(false);
        expect(RequestPolicy(other, request, 'delete')).toBe(false);
    });

    test('should allow Global Admin to suspend', () => {
        expect(RequestPolicy(adminGlobal, request, 'suspend')).toBe(true);
    });

    test('should allow City Manager to suspend in Same Context', () => {
        expect(RequestPolicy(cityManager, request, 'suspend')).toBe(true);
    });

    test('should deny City Manager to suspend in Different Context', () => {
        expect(RequestPolicy(cityManager, requestCrossCity, 'suspend')).toBe(false);
    });

    test('should allow everyone to view (assuming public marketplace)', () => {
        // 'viewPublished' is the public action
        expect(RequestPolicy(other, request, 'viewPublished')).toBe(true);
    });
});
