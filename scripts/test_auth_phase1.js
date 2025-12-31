const assert = require('assert');
const { v4: uuidv4 } = require('uuid');
const { sequelize, User, Role, Permission, UserRole, RolePermission } = require('../backend/sequelize_setup');
const RBACService = require('../backend/services/RBACService');
const PolicyEngine = require('../backend/policies/PolicyEngine');
const RequestPolicy = require('../backend/policies/RequestPolicy');

async function runTests() {
    console.log('🚀 Starting Phase 1 Verification (Manual Test)...');

    try {
        await sequelize.authenticate();
        console.log('✅ DB Connected');

        // --- RBAC Service Tests ---
        console.log('🔍 Testing RBACService...');

        const userId = uuidv4();
        const roleId = uuidv4();
        const permissionId = uuidv4();

        // Setup Data
        await User.create({
            id: userId,
            name: 'Test RBAC User',
            email: `rbac_${userId}@test.com`,
            password: 'password123',
            role: 'buyer'
        });
        await Role.create({ id: roleId, name: `Test Role ${roleId}` });
        await Permission.create({ id: permissionId, key: `TEST_PERM_${permissionId}` });

        // Case 1: No Role
        let hasPerm = await RBACService.hasPermission(userId, `TEST_PERM_${permissionId}`);
        assert.strictEqual(hasPerm, false, 'Should be false when no role assigned');

        // Case 2: Role assigned but no permission
        await UserRole.create({ userId, roleId });
        hasPerm = await RBACService.hasPermission(userId, `TEST_PERM_${permissionId}`);
        assert.strictEqual(hasPerm, false, 'Should be false when role has no permission');

        // Case 3: Role has Permission
        await RolePermission.create({ roleId, permissionId });
        hasPerm = await RBACService.hasPermission(userId, `TEST_PERM_${permissionId}`);
        assert.strictEqual(hasPerm, true, 'Should be true when role has permission');

        console.log('✅ RBACService Tests Passed');

        // --- Policy Engine Tests ---
        console.log('🔍 Testing PolicyEngine (Pure Logic)...');

        const mockUserRiyadh = { id: 'u1', context: { cityId: 'riyadh' } };
        const mockUserJeddah = { id: 'u2', context: { cityId: 'jeddah' } };
        const mockRequestRiyadh = { id: 'r1', cityId: 'riyadh' };

        // Test Policy
        assert.strictEqual(PolicyEngine.allows(mockUserRiyadh, mockRequestRiyadh, 'Request', 'view'), true);
        assert.strictEqual(PolicyEngine.allows(mockUserJeddah, mockRequestRiyadh, 'Request', 'view'), false);
        console.log('✅ PolicyEngine Tests Passed');

        // --- Middleware Logic Test (Manual Mock) ---
        // --- Middleware Logic Test (Manual Mock) ---
        console.log('🔍 Testing Middleware Logic (Strict Contract)...');
        const authorize = require('../backend/middleware/authorize');

        // Mock Env Owner
        const originalOwnerEnv = process.env.OWNER_ID;
        process.env.OWNER_ID = 'OWNER_123';

        // Prepare Mock Response
        let status = 0;
        let json = {};
        const resMock = {};
        resMock.status = (s) => {
            status = s;
            return resMock;
        };
        resMock.json = (d) => {
            json = d;
            return resMock;
        };

        // 1. Test Owner Bypass
        let nextCalled = false;
        let ownerReq = { user: { id: 'OWNER_123' } };
        await authorize('ANY_PERM')(ownerReq, resMock, () => { nextCalled = true; });
        assert.strictEqual(nextCalled, true, 'Owner should bypass strict ID check');

        // 2. Test Resource Missing (Should 500)
        status = 0; // Reset
        json = {};  // Reset

        // Mock User with Perm but missing Resource
        const originalHasPermission = RBACService.hasPermission;
        RBACService.hasPermission = async () => true;

        let userReq = { user: { id: 'u1' } };
        await authorize('PERM', 'Request')(userReq, resMock, () => { });
        assert.strictEqual(status, 500, 'Should 500 if req.resource is missing');

        // 3. Test Resource Present
        userReq.resource = mockRequestRiyadh; // Valid Resource
        userReq.user = mockUserRiyadh; // Valid User

        nextCalled = false;
        await authorize('PERM', 'Request')(userReq, resMock, () => { nextCalled = true; });
        assert.strictEqual(nextCalled, true, 'Should call next if resource present and policy allows');

        // Restore
        process.env.OWNER_ID = originalOwnerEnv;
        RBACService.hasPermission = originalHasPermission;

        console.log('✅ Middleware Tests Passed');

        console.log('🎉 ALL PHASE 1 CHECKS + MANDATORY PATCH PASSED.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Test Failed:', error);
        process.exit(1);
    }
}

runTests();
