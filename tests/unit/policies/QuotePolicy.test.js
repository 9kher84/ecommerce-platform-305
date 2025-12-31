const QuotePolicy = require('../../../backend/policies/QuotePolicy');

describe('QuotePolicy (Pure)', () => {
    const userSeller = { id: 'seller-1', role: 'seller' };
    const userBuyer = { id: 'buyer-1', role: 'buyer' };
    const userOther = { id: 'other-1', role: 'seller' };
    const userCityManager = { id: 'cm-1', role: 'city_manager', context: { cityId: 'city-1' } };

    const quote = {
        id: 'q-1',
        sellerId: 'seller-1',
        request: {
            id: 'r-1',
            userId: 'buyer-1',
            cityId: 'city-1'
        }
    };

    const quoteCrossCity = {
        id: 'q-2',
        sellerId: 'seller-1',
        request: {
            id: 'r-2',
            userId: 'buyer-1',
            cityId: 'city-2' // Different city
        }
    };

    test('should allow create without resource', () => {
        expect(QuotePolicy(userSeller, null, 'create')).toBe(true);
    });

    test('should allow seller (owner) to update/withdraw', () => {
        expect(QuotePolicy(userSeller, quote, 'update')).toBe(true);
        expect(QuotePolicy(userSeller, quote, 'withdraw')).toBe(true);
    });

    test('should deny other user update', () => {
        expect(QuotePolicy(userOther, quote, 'update')).toBe(false);
    });

    test('should allow buyer to accept/reject', () => {
        expect(QuotePolicy(userBuyer, quote, 'accept')).toBe(true);
        expect(QuotePolicy(userBuyer, quote, 'reject')).toBe(true);
    });

    test('should deny seller from accepting (self-dealing check technically, though logic allows buyer only)', () => {
        expect(QuotePolicy(userSeller, quote, 'accept')).toBe(false);
    });

    test('should allow View by Owner, Buyer, and Context Manager', () => {
        expect(QuotePolicy(userSeller, quote, 'view')).toBe(true);
        expect(QuotePolicy(userBuyer, quote, 'view')).toBe(true);
        expect(QuotePolicy(userCityManager, quote, 'view')).toBe(true);
    });

    test('should deny View by Context Manager if City Mismatch', () => {
        expect(QuotePolicy(userCityManager, quoteCrossCity, 'view')).toBe(false);
    });

    // ---------------------------------------------------------
    // New Action Tests (Phase 6)
    // ---------------------------------------------------------
    test('should allow Owner to delete/archive', () => {
        expect(QuotePolicy(userSeller, quote, 'delete')).toBe(true);
        expect(QuotePolicy(userSeller, quote, 'archive')).toBe(true);
    });

    test('should deny Non-Owner delete/archive', () => {
        expect(QuotePolicy(userOther, quote, 'delete')).toBe(false);
        expect(QuotePolicy(userCityManager, quote, 'delete')).toBe(false);
    });

    test('should allow Global Admin to suspend', () => {
        // userOther simulates someone without context, but Role check is outside policy.
        // If we assume Global Admin passed RBAC, Policy allows if no restricted context.
        const adminGlobal = { id: 'admin-g', role: 'admin' }; // No context
        expect(QuotePolicy(adminGlobal, quote, 'suspend')).toBe(true);
    });

    test('should allow Context Manager to suspend in Same City', () => {
        expect(QuotePolicy(userCityManager, quote, 'suspend')).toBe(true);
    });

    test('should deny Context Manager to suspend in Different City', () => {
        expect(QuotePolicy(userCityManager, quoteCrossCity, 'suspend')).toBe(false);
    });
});
