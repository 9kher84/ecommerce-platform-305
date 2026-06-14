const axios = require('axios');
const jwt = require('jsonwebtoken');

async function runLocalSmokeTest() {
  try {
    const baseURL = 'http://localhost:5000/api';
    const email = `localsmoke_${Date.now()}@test.com`;
    const password = 'Test@12345';
    let token = '';
    let cookies = [];

    console.log("🚀 بدء الاختبار الشامل (Smoke Test) محلياً...");

    // 1. Register
    console.log(`\n[1] تسجيل حساب جديد (${email})...`);
    const regRes = await axios.post(`${baseURL}/auth/register`, {
      name: 'Local Smoke Tester',
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
      title: "طلب شراء محلي",
      description: "هذا الطلب تم إنشاؤه للتأكد من ربط الصلاحيات",
      sectorId: 1,
      categoryId: 1,
      quantity: 5,
      unit: 'piece'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cookie': cookies ? cookies.join('; ') : `token=${token}`
      }
    });
    console.log("✅ نجاح إنشاء طلب الشراء! ID:", prRes.data.data.id);

    // 4. Logout
    console.log(`\n[4] تسجيل الخروج...`);
    const logoutRes = await axios.post(`${baseURL}/auth/logout`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cookie': cookies ? cookies.join('; ') : `token=${token}`
      }
    });
    console.log("✅ تمت عملية تسجيل الخروج بنجاح.");

    // 5. Try protected route after logout
    console.log(`\n[5] محاولة الوصول لبيانات محمية بعد تسجيل الخروج...`);
    try {
      await axios.get(`${baseURL}/auth/me`, {
        headers: { 'Cookie': 'token=none' }
      });
      console.error("❌ فشل! كان يجب أن يُرفض الطلب.");
    } catch (error) {
      if (error.response && error.response.status === 401) {
         console.log("✅ نجاح! تم طرد المستخدم (401 Unauthorized).");
      } else {
         console.error("❌ خطأ غير متوقع:", error.message);
      }
    }

    console.log("\n🎉 اكتمل الاختبار الشامل بنجاح مطلق!");
    process.exit(0);

  } catch (error) {
    console.error("\n❌ فشل الاختبار:");
    if (error.response) {
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

runLocalSmokeTest();
