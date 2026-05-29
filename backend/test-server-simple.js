// test-server-simple.js
const axios = require("axios");

async function test() {
  try {
    console.log("1. اختبار صحة الخادم...");
    const res = await axios.get("http://localhost:5000/api/health");
    console.log("✅ النتيجة:", res.data);

    console.log("\n2. محاولة تسجيل الدخول...");
    // حاول مع بيانات افتراضية - غيرها لتناسب بياناتك
    const loginData = {
      email: "owner@example.com", // 🔥 غير هذا للبريد الحقيقي
      password: "password123", // 🔥 غير هذا لكلمة المرور الحقيقية
    };

    try {
      const loginRes = await axios.post(
        "http://localhost:5000/api/auth/login",
        loginData,
      );
      console.log("✅ تسجيل الدخول:", loginRes.data.user?.name || "غير معروف");
      console.log("   الدور:", loginRes.data.user?.role);
      console.log("   isAdmin:", loginRes.data.user?.isAdmin);
      console.log("   الصلاحيات:", loginRes.data.user?.adminPermissions);
    } catch (loginErr) {
      console.log(
        "❌ فشل تسجيل الدخول:",
        loginErr.response?.data?.message || loginErr.message,
      );

      // جرب مستخدم آخر
      console.log("\n3. جرب مستخدم افتراضي آخر...");
      const testUsers = [
        { email: "admin@example.com", password: "password123" },
        { email: "test@example.com", password: "password123" },
        { email: "user@example.com", password: "password123" },
      ];

      for (const user of testUsers) {
        try {
          const res = await axios.post(
            "http://localhost:5000/api/auth/login",
            user,
          );
          console.log(`✅ نجح مع ${user.email}:`, res.data.user?.role);
          break;
        } catch (e) {
          // تجاهل الخطأ
        }
      }
    }
  } catch (error) {
    console.log("❌ الخطأ:", error.message);
    console.log("   تأكد أن الخادم يعمل على http://localhost:5000");
  }
}

test();
