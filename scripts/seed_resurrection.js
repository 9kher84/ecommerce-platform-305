require('dotenv').config();
const { sequelize, User, Role, Permission, RolePermission, UserRole, PurchaseRequest, PriceQuote, Delegation } = require('../backend/sequelize_setup');

// --- CONSTANTS ---
const OWNER_UUID = process.env.OWNER_ID || '11111111-1111-1111-1111-111111111111';
const PASSWORD_CLEAR = 'Password@123'; // Relies on User.beforeSave hook to hash

const ROLES = [
    'TECH_ADMIN',
    'FIELD_SUPERVISOR',
    'FINANCE_REVIEWER',
    'DISPUTE_HANDLER',
    'SELLER',
    'BUYER'
];

const PERMISSIONS = [
    // Requests
    'VIEW_REQUEST', 'CREATE_REQUEST', 'PUBLISH_REQUEST', 'SUSPEND_REQUEST', 'CANCEL_REQUEST',
    // Quotes
    'VIEW_QUOTES', 'CREATE_QUOTE', 'ACCEPT_QUOTE', 'REJECT_QUOTE',
    // Users
    'MANAGE_USERS', 'VIEW_USERS',
    // Financials
    'VIEW_FINANCIALS', 'PROCESS_PAYMENTS',
    // Disputes
    'HANDLE_DISPUTES',
    // System
    'VIEW_AUDIT_LOGS'
];

async function seedResurrection() {
    console.log('🚀 STARTING PLATFORM RESURRECTION...');

    try {
        await sequelize.authenticate();
        console.log('✅ DB Connected.');

        // 1. Roles & Permissions (Atomic)
        console.log('📦 Seeding Roles & Permissions...');

        // Upsert Roles
        const roleMap = {};
        for (const roleName of ROLES) {
            const [role] = await Role.findOrCreate({ where: { name: roleName } });
            roleMap[roleName] = role;
        }

        // Upsert Permissions
        const permMap = {};
        for (const permKey of PERMISSIONS) {
            const [perm] = await Permission.findOrCreate({
                where: { key: permKey },
                defaults: { description: `Allow ${permKey}` }
            });
            permMap[permKey] = perm;
        }

        // 🟢 BINDING RULES (Simulating Owner Manual Setup)
        console.log('🔗 Applying Owner-Defined Bindings...');

        // TECH_ADMIN Bindings
        await roleMap['TECH_ADMIN'].addPermissions([
            permMap['MANAGE_USERS'], permMap['VIEW_USERS'], permMap['VIEW_AUDIT_LOGS']
        ]);

        // SELLER Bindings
        await roleMap['SELLER'].addPermissions([
            permMap['VIEW_REQUEST'], permMap['CREATE_QUOTE'], permMap['VIEW_QUOTES']
        ]);

        // BUYER Bindings
        await roleMap['BUYER'].addPermissions([
            permMap['CREATE_REQUEST'], permMap['PUBLISH_REQUEST'], permMap['CANCEL_REQUEST'],
            permMap['VIEW_QUOTES'], permMap['ACCEPT_QUOTE'], permMap['REJECT_QUOTE']
        ]);

        // FIELD_SUPERVISOR Bindings (Contextual usually, but permission to enter specific views)
        await roleMap['FIELD_SUPERVISOR'].addPermissions([
            permMap['VIEW_REQUEST'], permMap['SUSPEND_REQUEST']
        ]);

        // 2. USERS (The Cast)
        console.log('👥 Casting Users...');

        // 👑 OWNER (Sovereign)
        // Check if exists with specific ID or Email
        let owner = await User.findOne({ where: { id: OWNER_UUID } });
        if (!owner) {
            // Try by email to avoid duplicate error on ID collision if email differs
            owner = await User.findOne({ where: { email: 'owner@platform.internal' } });
        }

        if (owner) {
            // Align them
            owner.email = 'owner@platform.internal';
            owner.role = 'admin'; // Legacy field fallback, authorization ignores it for Owner ID
            // Check ID. If ID differs from ENV, warn strictly.
            if (owner.id !== OWNER_UUID) {
                console.error(`⚠️ CRITICAL: Existing Owner ID ${owner.id} does not match expected ${OWNER_UUID}. Authorization Bypass may fail!`);
            }
            await owner.save();
        } else {
            owner = await User.create({
                id: OWNER_UUID,
                name: 'Platform Sovereign',
                email: 'owner@platform.internal',
                password: PASSWORD_CLEAR,
                role: 'admin' // Legacy
            });
        }
        console.log(`👑 OWNER READY: ${owner.id}`);

        // 🛒 BUYERS
        const buyer1 = await createUser('Buyer Unit 1', 'buyer1@test.com', roleMap['BUYER']);
        const buyer2 = await createUser('Buyer Unit 2', 'buyer2@test.com', roleMap['BUYER']);

        // 🏭 SELLERS
        const seller1 = await createUser('Seller Ryd', 'seller1@test.com', roleMap['SELLER']);
        const seller2 = await createUser('Seller Jed', 'seller2@test.com', roleMap['SELLER']);

        // 👮 STAFF
        const techAdmin = await createUser('Tech Admin', 'tech@platform.internal', roleMap['TECH_ADMIN']);
        const fieldSup = await createUser('Field Sup', 'field@platform.internal', roleMap['FIELD_SUPERVISOR']);

        // 3. SCENARIOS (Requests & Quotes)
        console.log('🎬 Action! Creating Scenarios...');

        // Scenario A: Published Request with Quotes
        const req1 = await PurchaseRequest.create({
            userId: buyer1.id,
            title: 'Office Furniture 2025',
            status: 'published',
            categoryId: 1
        });

        // Quotes for Req1
        await PriceQuote.create({ requestId: req1.id, sellerId: seller1.id, price: 5000, status: 'pending' });
        await PriceQuote.create({ requestId: req1.id, sellerId: seller2.id, price: 5500, status: 'rejected' });

        // Scenario B: Draft Request
        await PurchaseRequest.create({
            userId: buyer1.id,
            title: 'Confidential Project',
            status: 'draft',
            categoryId: 1
        });

        // Scenario C: Suspended Request (by Field Sup?) -> Requires state machine update later, currently 'cancelled' or similar. 
        // Using 'cancelled' for now to represent Stopped.
        await PurchaseRequest.create({
            userId: buyer2.id,
            title: 'Cancelled Initiative',
            status: 'cancelled',
            categoryId: 1
        });

        console.log('✅ RESURRECTION COMPLETE.');
        console.log('---------------------------------------------------');
        console.log(`⚠️  ENSURE .env HAS: OWNER_ID=${owner.id}`);
        console.log('---------------------------------------------------');
        process.exit(0);

    } catch (e) {
        console.error('❌ SEED FAILED:', e);
        process.exit(1);
    }
}

async function createUser(name, email, role) {
    let user = await User.findOne({ where: { email } });
    if (!user) {
        user = await User.create({
            name, email, password: PASSWORD_CLEAR, role: 'buyer'
        });
    }
    // Bind Role
    await UserRole.findOrCreate({
        where: { userId: user.id, roleId: role.id }
    });
    return user;
}

seedResurrection();
