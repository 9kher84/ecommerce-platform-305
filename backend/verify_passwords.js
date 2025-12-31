// verify_passwords.js
// سكربت للتحقق من كلمات المرور وإصلاحها

const { sequelize, User } = require('./sequelize_setup');

const verifyPasswords = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ متصل بقاعدة البيانات\n');

        const testAccounts = [
            'owner@test.com',
            'admin@test.com',
            'seller@test.com',
            'buyer-premium@test.com',
            'buyer@test.com'
        ];

        console.log('🔍 التحقق من كلمات المرور...\n');

        for (const email of testAccounts) {
            const user = await User.findOne({ where: { email } });

            if (!user) {
                console.log(`❌ ${email} - المستخدم غير موجود`);
                continue;
            }

            // اختبار كلمة المرور
            const isValid = await user.comparePassword('123456');

            if (isValid) {
                console.log(`✅ ${email} - كلمة المرور صحيحة`);
                console.log(`   الدور: ${user.role}`);
                console.log(`   الباقة: ${user.subscriptionTier}`);
                console.log(`   نشط: ${user.isActive ? 'نعم' : 'لا'}`);
            } else {
                console.log(`❌ ${email} - كلمة المرور خاطئة!`);

                // إعادة تعيين كلمة المرور (سيتم تشفيرها تلقائياً بواسطة beforeSave hook)
                console.log(`   🔄 إعادة تعيين كلمة المرور...`);
                user.password = '123456'; // نضع كلمة المرور بدون تشفير - الـ hook سيشفرها
                await user.save();
                console.log(`   ✅ تم إعادة تعيين كلمة المرور`);
            }
            console.log('');
        }

        console.log('─'.repeat(60));
        console.log('✅ اكتمل الفحص!');
        console.log('📝 يمكنك الآن تسجيل الدخول بكلمة المرور: 123456');

    } catch (error) {
        console.error('❌ خطأ:', error);
    } finally {
        await sequelize.close();
    }
};

verifyPasswords()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
