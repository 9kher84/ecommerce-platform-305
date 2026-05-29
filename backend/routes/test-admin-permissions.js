// test-admin-permissions.js
const axios = require("axios");

async function testAdminPermissions() {
  const BASE_URL = "http://localhost:5000/api";

  try {
    // 1. تسجيل الدخول كمالك
    console.log("🔐 تسجيل الدخول...");
    const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
      email: "owner@example.com", // ضع بريد المالك
      password: "password", // ضع كلمة مرور المالك
    });

    const token = loginRes.data.token;
    console.log("✅ تم تسجيل الدخول:", loginRes.data.user.name);

    // 2. اختبار الصلاحيات
    console.log("\n🔍 اختبار صلاحيات المستخدم...");
    const permissionsRes = await axios.get(`${BASE_URL}/admin/permissions`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log(
      "✅ صلاحيات المستخدم:",
      JSON.stringify(permissionsRes.data.data, null, 2),
    );

    // 3. اختبار جلب جميع المستخدمين
    console.log("\n👥 اختبار جلب جميع المستخدمين...");
    try {
      const usersRes = await axios.get(`${BASE_URL}/admin/users/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(`✅ عدد المستخدمين: ${usersRes.data.data.length}`);
    } catch (error) {
      console.log(
        "❌ خطأ في جلب المستخدمين:",
        error.response?.data?.error || error.message,
      );
    }
  } catch (error) {
    console.error("❌ خطأ في الاختبار:", error.message);
  }
}

testAdminPermissions();
