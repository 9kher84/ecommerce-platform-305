const { sequelize, User, PurchaseRequest, RolePermission, UserRole } = require('../backend/sequelize_setup');
const RequestPolicy = require('../backend/policies/RequestPolicy');
const RBACService = require('../backend/services/RBACService');

// CONSTANTS (Must match Seed)
const OWNER_UUID = process.env.OWNER_ID || '11111111-1111-1111-1111-111111111111';

async function verifyResurrection() {
    console.log('🕵️ STARTING RESURRECTION VERIFICATION...');

    try {
        await sequelize.authenticate();
        console.log('✅ DB Connected.');

        // 1. Verify Marketplace Visibility (Policy Check)
        console.log('\n--- 1. Marketplace Visibility (Public Policy) ---');
        const buyer = await User.findOne({ where: { email: 'buyer1@test.com' } });
        if (!buyer) throw new Error('Buyer1 not found (Seed fail?)');

        // Is Policy allowing viewPublished?
        // Note: Policy returns boolean.
        const canView = RequestPolicy(buyer, { some: 'resource' }, 'viewPublished');
        if (canView === true) {
            console.log('✅ Buyer CAN viewPublished (Policy Logic Pass).');
        } else {
            console.error('❌ Buyer CANNOT viewPublished (Policy Failed). check RequestPolicy.js');
        }

        // 2. Verify Owner Control (Bypass)
        console.log('\n--- 2. Owner Sovereignty (Bypass logic) ---');
        // We can't easily test Middleware execution here without Supertest, 
        // but we can verify Owner has NO Permissions in DB, but has specific ID.
        const owner = await User.findByPk(OWNER_UUID);
        if (!owner) throw new Error('Owner not found!');

        // Owner should NOT have permissions in DB (Bypass handles authority)
        // RBACService.hasPermission checks DB. If Owner has no Role/Perms, it returns false.
        const ownerHasPerm = await RBACService.hasPermission(OWNER_UUID, 'MANAGE_USERS');
        if (ownerHasPerm === false) {
            console.log('✅ Owner has NO DB Permission (Bypass Reliance Confirmed).');
        } else {
            console.warn('⚠️ Owner HAS DB Permission (Not strictly forbidden but Bypass preferred).');
        }

        // Check Roles Table
        const ownerRoles = await UserRole.findAll({ where: { userId: OWNER_UUID } });

        if (ownerRoles.length === 0) {
            console.log('✅ Owner has NO DB Roles (Correct).');
        } else {
            console.warn(`⚠️ Owner has ${ownerRoles.length} DB Roles. Verify strict bypass in authorize.js ignores this.`);
        }

        // 3. Verify Staff Limitations
        console.log('\n--- 3. Staff Limitations ---');
        const techAdmin = await User.findOne({ where: { email: 'tech@platform.internal' } });
        const seller = await User.findOne({ where: { email: 'seller1@test.com' } });

        const techCanManage = await RBACService.hasPermission(techAdmin.id, 'MANAGE_USERS');
        const sellerCanManage = await RBACService.hasPermission(seller.id, 'MANAGE_USERS');

        if (techCanManage) console.log('✅ Tech Admin HAS MANAGE_USERS.');
        else console.error('❌ Tech Admin MISSING MANAGE_USERS.');

        if (!sellerCanManage) console.log('✅ Seller MISSING MANAGE_USERS (Correct).');
        else console.error('❌ Seller HAS MANAGE_USERS (Security Breach).');

        console.log('\n✅ VERIFICATION COMPLETE.');
        process.exit(0);

    } catch (e) {
        console.error('❌ VERIFICATION FAILED:', e);
        process.exit(1);
    }
}

verifyResurrection();
