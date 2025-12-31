// ============================================================
// 7. SAMPLE DATA
// ============================================================

async function addSampleData() {
    try {
        // Check if users already exist
        const userCount = await User.count();

        if (userCount > 0) {
            console.log(`ℹ️  Found ${userCount} existing users. Skipping sample data.`);
            return;
        }

        console.log('📦 Creating sample users...');

        // Create 7 test users (beforeCreate hook will hash passwords)
        await User.bulkCreate([
            // BUYERS (3)
            {
                name: 'مشتري مجاني',
                email: 'buyer_free@test.com',
                password: 'password123',
                role: 'buyer',
                subscriptionTier: 'free',
                isActive: true
            },
            {
                name: 'مشتري خطة أ',
                email: 'buyer_a@test.com',
                password: 'password123',
                role: 'buyer',
                subscriptionTier: 'plan_a',
                isActive: true
            },
            {
                name: 'مشتري خطة ب',
                email: 'buyer_b@test.com',
                password: 'password123',
                role: 'buyer',
                subscriptionTier: 'plan_b',
                isActive: true
            },
            // SELLERS (3)
            {
                name: 'بائع مجاني',
                email: 'seller_free@test.com',
                password: 'password123',
                role: 'seller',
                subscriptionTier: 'free',
                isActive: true
            },
            {
                name: 'بائع خطة أ',
                email: 'seller_a@test.com',
                password: 'password123',
                role: 'seller',
                subscriptionTier: 'plan_a',
                isActive: true
            },
            {
                name: 'بائع خطة ب',
                email: 'seller_b@test.com',
                password: 'password123',
                role: 'seller',
                subscriptionTier: 'plan_b',
                isActive: true
            },
            // ADMIN (1)
            {
                name: 'مدير النظام',
                email: 'admin@test.com',
                password: 'admin123',
                role: 'super_admin',
                subscriptionTier: 'free',
                isActive: true
            }
        ], {
            individualHooks: true // Ensure beforeCreate hook runs for each user
        });

        console.log('✅ Sample users created successfully!');

        // Create sample categories with Arabic and English names
        await Category.bulkCreate([
            {
                name_ar: 'مواد البناء',
                name_en: 'Construction Materials',
                description_ar: 'إسمنت، طوب، حديد، إلخ',
                description_en: 'Cement, bricks, steel, etc.'
            },
            {
                name_ar: 'إلكترونيات',
                name_en: 'Electronics',
                description_ar: 'حواسيب، هواتف، ملحقات',
                description_en: 'Computers, phones, accessories'
            },
            {
                name_ar: 'أثاث',
                name_en: 'Furniture',
                description_ar: 'أثاث مكتبي ومنزلي',
                description_en: 'Office and home furniture'
            },
            {
                name_ar: 'مركبات',
                name_en: 'Vehicles',
                description_ar: 'سيارات، شاحنات، دراجات',
                description_en: 'Cars, trucks, motorcycles'
            },
            {
                name_ar: 'خدمات',
                name_en: 'Services',
                description_ar: 'خدمات احترافية',
                description_en: 'Professional services'
            }
        ]);

        console.log('✅ Sample categories created!');

    } catch (error) {
        console.error('⚠️  Failed to create sample data:', error.message);
    }
}
