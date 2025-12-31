const { sequelize, User, PurchaseRequest, PriceQuote, Delegation } = require('../backend/sequelize_setup');
const { v4: uuidv4 } = require('uuid');

const OWNER_ID = process.env.OWNER_ID || '11111111-1111-1111-1111-111111111111';
const PASSWORD = 'password123';

async function seedSandbox() {
    console.log('🌱 SEEDING SANDBOX ENVIRONMENT (Strict Mandate Scenarios)...');

    try {
        await sequelize.authenticate();
        // await sequelize.sync({ force: true }); 

        // 1. ACTORS
        const actors = [
            { id: OWNER_ID, name: 'The Owner', email: 'owner@platform.internal', role: 'admin', subscriptionTier: 'plan_b' },
            { name: 'Buyer Free', email: 'buyer.free@test.com', role: 'buyer', subscriptionTier: 'free' },
            { name: 'Buyer Plan A', email: 'buyer.plana@test.com', role: 'buyer', subscriptionTier: 'plan_a' },
            { name: 'Buyer Plan B', email: 'buyer.planb@test.com', role: 'buyer', subscriptionTier: 'plan_b' },
            { name: 'Seller Free', email: 'seller.free@test.com', role: 'seller', subscriptionTier: 'free' },
            { name: 'Seller Plan A', email: 'seller.plana@test.com', role: 'seller', subscriptionTier: 'plan_a' },
            { name: 'Seller Plan B', email: 'seller.planb@test.com', role: 'seller', subscriptionTier: 'plan_b' },
            { name: 'Tech Admin', email: 'tech@platform.internal', role: 'admin', subscriptionTier: 'plan_b' },
        ];

        const createdActors = {};

        for (const actor of actors) {
            const [user] = await User.findOrCreate({
                where: { email: actor.email },
                defaults: {
                    id: actor.id || uuidv4(),
                    name: actor.name,
                    password: PASSWORD,
                    role: actor.role || 'buyer',
                    subscriptionTier: actor.subscriptionTier,
                    isActive: true
                }
            });
            createdActors[actor.email] = user;
            console.log(`👤 Actor: ${actor.name} (${actor.email}) - ID: ${user.id}`);
        }

        const buyerB = createdActors['buyer.planb@test.com'];
        const sellerB = createdActors['seller.planb@test.com'];

        // Create or Find Category
        const [category] = await require('../backend/sequelize_setup').Category.findOrCreate({
            where: { name_en: 'General Sandbox' },
            defaults: {
                name_ar: 'عام',
                name_en: 'General Sandbox'
            }
        });
        const categoryId = category.id;

        // 2. REQUESTS (All States)
        const scenarios = [
            { status: 'draft', title: 'Scenario: Draft Request' },
            { status: 'published', title: 'Scenario: Published Request' },
            { status: 'quoting', title: 'Scenario: Quoting Phase' },
            { status: 'awaiting_decision', title: 'Scenario: Awaiting Decision' },
            { status: 'accepted', title: 'Scenario: Accepted Deal' },
            { status: 'suspended', title: 'Scenario: Suspended by Admin' },
            { status: 'cancelled', title: 'Scenario: Cancelled by User' }
        ];

        for (const scene of scenarios) {
            const req = await PurchaseRequest.create({
                userId: buyerB.id,
                title: scene.title,
                description: `Strict State Machine Test: ${scene.status}`,
                categoryId: categoryId, // Integer ID
                status: scene.status,
                post_type: 'standard',
                auction_type: 'public',
                deadline: new Date(Date.now() + 86400000),
                is_active: scene.status !== 'suspended'
            });
            console.log(`📜 Request: ${scene.title} [${scene.status}]`);

            // Add Quotes
            if (['quoting', 'awaiting_decision', 'accepted'].includes(scene.status)) {
                await PriceQuote.create({
                    purchaseRequestId: req.id,
                    sellerId: sellerB.id,
                    amount: 1000,
                    fixedPrice: 1000,
                    status: scene.status === 'accepted' ? 'accepted' : 'pending',
                    priceType: 'fixed',
                    currency: 'SAR'
                });
                console.log(`   🏷️ Quote Added`);
                await req.increment('quoteCount');
            }
        }

        // 3. DELEGATIONS
        const techAdmin = createdActors['tech@platform.internal'];
        if (techAdmin) {
            await Delegation.create({
                fromUserId: OWNER_ID,
                toUserId: techAdmin.id,
                type: 'GENERAL',
                scopeType: 'global',
                permissionKey: '*',
                expiresAt: new Date(Date.now() + 10000000)
            });
            console.log('🤝 Delegation: Owner -> Tech Admin (GENERAL/Global)');
        }

        console.log('\n✅ SANDBOX SEEDING COMPLETE.');
        process.exit(0);
    } catch (e) {
        console.error('❌ SEEDING FAILED:', e);
        process.exit(1);
    }
}

seedSandbox();
