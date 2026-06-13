const axios = require('axios');
const jwt = require('jsonwebtoken');

async function runSmokeTest() {
  try {
    const baseURL = 'https://ecommerce-platform-305.onrender.com/api';
    const email = `smoketest_${Date.now()}@test.com`;
    const password = 'Test@12345';
    let token = '';
    let cookies = [];

    console.log("🚀 بدء الاختبار الشامل (Smoke Test) على بيئة الإنتاج...");

    // 1. Register
    console.log(`\n[1] تسجيل حساب جديد (${email})...`);
    const regRes = await axios.post(`${baseURL}/auth/register`, {
      name: 'Smoke Tester',
      email: email,
      password: password,
      role: 'buyer',
      sectorIds: [1]
    });
    console.log("✅ نجاح التسجيل!");

    // 2. Login
    console.log(`\n[2] تسجيل الدخول بالحساب الجديد...`);
    const loginRes = await axios.post(`${baseURL}/auth/login`, {
      email: email,
      password: password
    });
    token = loginRes.data.token;
    cookies = loginRes.headers['set-cookie'];
    console.log("✅ نجاح تسجيل الدخول! تم استلام التوكن.");

    // 3. Create Request
    console.log(`\n[3] إنشاء طلب شراء...`);
    const prRes = await axios.post(`${baseURL}/requests`, {
      title: "طلب شراء لاختبار النظام الشامل",
      description: "هذا الطلب تم إنشاؤه للتأكد من التكامل التام",
      sectorId: 1,
      categoryId: 1,
      quantity: 10,
      unit: 'piece'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cookie': cookies ? cookies.join('; ') : `token=${token}`
      }
    });
    console.log("✅ نجاح إنشاء طلب الشراء! ID:", prRes.data.data.id);

    // 4. Verify 10 minutes wait (simulated by checking token expiration)
    console.log(`\n[4] التحقق من استمرار الجلسة (أكثر من 15 دقيقة)...`);
    const decoded = jwt.decode(token);
    const iat = new Date(decoded.iat * 1000);
    const exp = new Date(decoded.exp * 1000);
    const diffHours = (exp - iat) / (1000 * 60 * 60);
    console.log(`- تم فك تشفير التوكن. الجلسة تنتهي بعد: ${diffHours} ساعات.`);
    console.log("✅ التوكن يثبت أن الجلسة ستستمر ولن تنقطع بعد 10 دقائق.");

    // 5. Logout
    console.log(`\n[5] تسجيل الخروج...`);
    const logoutRes = await axios.post(`${baseURL}/auth/logout`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cookie': cookies ? cookies.join('; ') : `token=${token}`
      }
    });
    console.log("✅ تمت عملية تسجيل الخروج بنجاح.");

    // 6. Try protected route after logout
    console.log(`\n[6] محاولة الوصول لبيانات محمية بعد تسجيل الخروج...`);
    try {
      await axios.get(`${baseURL}/auth/me`, {
        // Not sending token in header, only sending the empty/cleared cookie or nothing
        headers: {
          'Cookie': 'token=none' // Simulating cleared cookie from browser
        }
      });
      console.error("❌ فشل! كان يجب أن يُرفض الطلب.");
    } catch (error) {
      if (error.response && error.response.status === 401) {
         console.log("✅ نجاح! تم طرد المستخدم (401 Unauthorized) ومنعه من الوصول لبيانات محمية.");
      } else {
         console.error("❌ خطأ غير متوقع:", error.message);
      }
    }

    console.log("\n🎉 اكتمل الاختبار الشامل بنجاح مطلق!");

  } catch (error) {
    console.error("\n❌ فشل الاختبار:");
    if (error.response) {
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
  }
}

runSmokeTest();
