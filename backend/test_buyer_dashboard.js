const axios = require("axios");

const API_URL = "http://localhost:5000/api";

async function testBuyerDashboard() {
  try {
    console.log("🚀 Starting Buyer Dashboard Test...");

    // 0. Health Check
    try {
      const health = await axios.get(`${API_URL}/health`);
      console.log("✅ Server is healthy:", health.data.message);
    } catch (err) {
      console.error("❌ Server is unreachable:", err.message);
      if (err.code === "ECONNREFUSED") {
        console.error("   Make sure the server is running on port 5000");
      }
      return;
    }

    // 1. Register/Login a Buyer
    let token;
    const email = `buyer_dash_${Date.now()}@example.com`;
    const password = "password123";

    console.log(`👤 Creating test buyer: ${email}`);

    try {
      const registerRes = await axios.post(`${API_URL}/auth/register`, {
        name: "Dashboard Tester",
        email,
        password,
        role: "buyer",
      });
      token = registerRes.data.token;
      console.log("✅ Registered successfully");
    } catch (err) {
      console.error(
        "❌ Registration failed:",
        err.response ? err.response.data : err.message,
      );
      return;
    }

    const config = {
      headers: { Authorization: `Bearer ${token}` },
    };

    // 2. Update Profile (Add Mobile & Business Name)
    console.log("📝 Updating profile with new fields...");
    try {
      const updateRes = await axios.put(
        `${API_URL}/users/profile`,
        {
          mobile: "0501234567",
          businessName: "Test Corp",
          notificationSettings: {
            email: true,
            whatsapp: true,
            internal: false,
          },
        },
        config,
      );

      console.log(
        "✅ Profile updated:",
        updateRes.data.user.mobile === "0501234567" ? "Success" : "Failed",
      );
    } catch (err) {
      console.error(
        "❌ Update profile failed:",
        err.response ? err.response.data : err.message,
      );
    }

    // 3. Get Profile (Verify new fields)
    console.log("🔍 Fetching profile...");
    try {
      const profileRes = await axios.get(`${API_URL}/users/profile`, config);
      const user = profileRes.data.user;

      console.log("--- Profile Data ---");
      console.log(`Mobile: ${user.mobile}`);
      console.log(`Business Name: ${user.businessName}`);
      console.log(
        `Stats: Published=${user.publishedRequestsCount}, Deals=${user.completedDealsCount}`,
      );
      console.log(
        `Notifications: ${JSON.stringify(user.notificationSettings)}`,
      );

      if (user.mobile && user.businessName) {
        console.log("✅ New fields are present!");
      } else {
        console.log("❌ New fields are MISSING!");
      }
    } catch (err) {
      console.error(
        "❌ Get profile failed:",
        err.response ? err.response.data : err.message,
      );
    }

    // 4. Get Dashboard Stats
    console.log("📊 Fetching Dashboard Stats...");
    try {
      const statsRes = await axios.get(
        `${API_URL}/dashboard/buyer/stats`,
        config,
      );
      console.log("✅ Stats fetched successfully:", statsRes.data.stats);
    } catch (err) {
      console.error(
        "❌ Failed to fetch stats:",
        err.response ? err.response.data : err.message,
      );
    }

    // 5. Get Invoices
    console.log("🧾 Fetching Invoices...");
    try {
      const invoicesRes = await axios.get(
        `${API_URL}/dashboard/buyer/invoices`,
        config,
      );
      console.log(`✅ Invoices fetched: ${invoicesRes.data.count}`);
    } catch (err) {
      console.error(
        "❌ Failed to fetch invoices:",
        err.response ? err.response.data : err.message,
      );
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testBuyerDashboard();
