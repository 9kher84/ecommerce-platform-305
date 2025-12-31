const { sequelize, SystemSetting, User, Post, Offer, Deal } = require('./sequelize_setup');

async function setupDatabase() {
    try {
        console.log('🔄 Starting Database Setup...');
        await sequelize.authenticate();

        // 1. Enable Payment System
        console.log('🔧 Enabling Payment System...');
        const [setting, created] = await SystemSetting.findOrCreate({
            where: { key: 'payment_system_enabled' },
            defaults: { value: 'true', description: 'Enable/Disable Payment System' }
        });

        if (!created && setting.value !== 'true') {
            setting.value = 'true';
            await setting.save();
        }
        console.log('✅ Payment System Enabled');

        // 2. Seed Deal
        console.log('🌱 Seeding Deal for Testing...');
        const buyer = await User.findOne({ where: { email: 'buyer1@example.com' } });
        const seller = await User.findOne({ where: { email: 'seller1@example.com' } });

        if (!buyer || !seller) {
            console.log('⚠️ Users not found. Skipping deal creation. (Server might have just restarted with force:true)');
            // Note: If force:true ran, users are created by sequelize_setup.js addSampleData()
            // But we need to make sure that finished.
        } else {
            // Check if deal exists
            const existingDeal = await Deal.findOne({ where: { buyerId: buyer.id, sellerId: seller.id } });
            if (existingDeal) {
                console.log(`ℹ️ Deal already exists: ${existingDeal.id}`);
            } else {
                const post = await Post.create({
                    title: 'Payment Test Post',
                    description: 'Unit Test Item',
                    buyerId: buyer.id,
                    expiryDate: new Date(Date.now() + 86400000),
                    status: 'open',
                    deliveryLocation: 'Riyadh'
                });

                const offer = await Offer.create({
                    postId: post.id,
                    buyerId: seller.id,
                    amount: 500.00,
                    status: 'accepted'
                });

                const deal = await Deal.create({
                    postId: post.id,
                    offerId: offer.id,
                    buyerId: buyer.id,
                    sellerId: seller.id,
                    finalAmount: 500.00,
                    status: 'agreed'
                });
                console.log(`✅ Created New Deal: ${deal.id}`);
            }
        }

        console.log('🎉 Database Setup Complete!');

    } catch (error) {
        console.error('❌ Setup Failed:', error);
    } finally {
        await sequelize.close();
    }
}

setupDatabase();
