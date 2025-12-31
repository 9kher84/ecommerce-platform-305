const { sequelize, User, PurchaseRequest, AuditLog, Delegation } = require('../backend/sequelize_setup');
const RequestService = require('../backend/services/RequestService');

async function testPurchaseRequestFlow() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to DB');

        // 1. Setup Data
        // Create Buyer
        const buyer = await User.create({
            name: 'Buyer F1',
            email: `buyer_${Date.now()}@test.com`,
            password: 'password123',
            role: 'buyer',
            subscriptionTier: 'plan_a'
        });

        // Create Admin
        const admin = await User.create({
            name: 'Admin F1',
            email: `admin_${Date.now()}@test.com`,
            password: 'password123',
            role: 'admin'
        });

        // Create Request (Draft)
        const request = await PurchaseRequest.create({
            userId: buyer.id,
            title: 'F1 Test Request',
            status: 'draft',
            categoryId: 1
        });

        console.log(`✅ Created Request ${request.id} [${request.status}]`);

        // 2. Publish Request (Owner Action)
        const authContext = { actor: buyer, principal: buyer, delegation: null, ip: '127.0.0.1' };
        await RequestService.transitionRequestStatus(request.id, 'published', authContext);

        await request.reload();
        console.log(`✅ Transitioned to ${request.status}`);

        // 3. Verify Audit Log (Publish)
        const log = await AuditLog.findOne({
            where: {
                resourceId: request.id,
                action: 'REQUEST_STATUS_PUBLISHED'
            }
        });
        if (!log) throw new Error('❌ Audit Log missing for PUBLISH action');
        console.log('✅ Audit Log Verified:', log.action);

        // 4. Test Delegation Audit (Admin Cancel)
        // Create REAL Delegation
        const delegation = await Delegation.create({
            fromUserId: buyer.id,
            toUserId: admin.id,
            type: 'GENERAL',
            status: 'ACTIVE',
            isActive: true
        });

        const delegationAuth = {
            actor: admin,
            principal: buyer,
            delegation: delegation,
            ip: '127.0.0.1'
        };

        await RequestService.transitionRequestStatus(request.id, 'cancelled', delegationAuth);

        await request.reload();
        console.log(`✅ Delegated Cancel Success. Status: ${request.status}`);

        // Verify Audit for Delegation
        const delLog = await AuditLog.findOne({
            where: {
                resourceId: request.id,
                action: 'REQUEST_STATUS_CANCELLED'
            }
        });

        if (delLog && delLog.actorId === admin.id && delLog.principalId === buyer.id && delLog.delegationId === delegation.id) {
            console.log('✅ Delegation Audit Verified (Actor != Principal, Delegation Recorded)');
        } else {
            console.log('DelLog:', delLog ? delLog.toJSON() : 'null');
            throw new Error(`❌ Delegation Audit Mismatch.`);
        }

        console.log('✅ F1 Flow Verification COMPLETE');
        process.exit(0);

    } catch (error) {
        console.error('❌ Test Failed:', error);
        process.exit(1);
    }
}

testPurchaseRequestFlow();
