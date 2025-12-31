// test_simple.js

const axios = require('axios');

async function test() {
    try {
        // 1. تسجيل الدخول بمستخدم موجود
        const login = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'seller_b@test.com',
            password: 'Test@123'
        });

        const token = login.data.token;

        // 2. محاولة تحديث البروفايل
        const update = await axios.put('http://localhost:5000/api/users/profile', {
            mobile: '0555555555',
            businessName: 'شركة الاختبار'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ النجاح:', update.data);
    } catch (error) {
        console.log('❌ الخطأ:', error.response?.data || error.message);
    }
}

test();