const PolicyEngine = require('../../policies/PolicyEngine');
const RequestPolicy = require('../../policies/RequestPolicy');

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

// Mock Resource (Request)
const mockRequestRiyadh = {
    id: 'req1',
    cityId: 'uuid-riyadh',
    city: 'Riyadh' // Legacy string check if needed
};

describe('PolicyEngine Unit Tests', () => {
    test('PolicyEngine.allows matches RequestPolicy correctly', () => {
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

    test('RequestPolicy specific: Pure function logic', () => {
        expect(RequestPolicy(mockUserRiyadh, mockRequestRiyadh, 'view')).toBe(true);
    });
});
