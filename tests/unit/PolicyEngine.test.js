const PolicyEngine = require('../../backend/policies/PolicyEngine');
const RequestPolicy = require('../../backend/policies/RequestPolicy');

// Mock User with Context
const mockUserRiyadh = {
    id: 'user1',
    context: {
        cityId: 'uuid-riyadh'
    }
};

const mockUserJeddah = {
    id: 'user2',
    context: {
        cityId: 'uuid-jeddah'
    }
};

const mockUserGlobal = {
    id: 'user3',
    context: {} // No restriction?
};

// Mock Resource (Request)
const mockRequestRiyadh = {
    id: 'req1',
    cityId: 'uuid-riyadh',
    city: 'Riyadh'
};

describe('PolicyEngine Unit Tests', () => {
    test('PolicyEngine.allows matches RequestPolicy correctly', () => {
        // Should route to RequestPolicy
        // We know RequestPolicy implementation logic.
        // Riyadh User -> Riyadh Request = True
        const result = PolicyEngine.allows(mockUserRiyadh, mockRequestRiyadh, 'Request', 'view');
        expect(result).toBe(true);
    });

    test('Access Denied for Context Mismatch', () => {
        // Jeddah User -> Riyadh Request = False
        const result = PolicyEngine.allows(mockUserJeddah, mockRequestRiyadh, 'Request', 'view');
        expect(result).toBe(false);
    });

    test('Access Denied for mismatched resource type (Safe Default)', () => {
        const result = PolicyEngine.allows(mockUserRiyadh, mockRequestRiyadh, 'UnknownType', 'view');
        expect(result).toBe(false);
    });

    // Test pure function logic specifically if needed
    test('RequestPolicy specific: Owner implicit check is strictly middleware, but policy is pure', () => {
        // Policy logic for Request currently checks context only.
        // If context matches, true.
        expect(RequestPolicy(mockUserRiyadh, mockRequestRiyadh, 'view')).toBe(true);
    });
});
