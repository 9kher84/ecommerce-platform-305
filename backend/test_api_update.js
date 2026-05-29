const axios = require("axios");

const API_URL = "http://localhost:5000/api";

async function testApiUpdate() {
  try {
    console.log("🚀 Starting API Update Test...");

    // 1. Register
    const email = `api_test_${Date.now()}@example.com`;
    console.log(`👤 Creating user: ${email}`);

    const registerRes = await axios.post(`${API_URL}/auth/register`, {
      name: "API Tester",
      email,
      password: "password123",
      role: "buyer",
    });
    const token = registerRes.data.token;

    // 2. Update Profile (Mobile)
    console.log("📝 Sending update request (Mobile: 0555555555)...");
    try {
      const updateRes = await axios.put(
        `${API_URL}/users/profile`,
        {
          mobile: "0555555555",
          businessName: "API Corp",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      console.log("✅ Response:", updateRes.data.user);

      if (updateRes.data.user.mobile === "0555555555") {
        console.log("🎉 SUCCESS: Server accepted the update!");
      } else {
        console.log("⚠️ WARNING: Update accepted but value mismatch?");
      }
    } catch (err) {
      console.error(
        "❌ UPDATE FAILED:",
        err.response ? err.response.data : err.message,
      );
      console.log(
        "👉 This means the server is still running OLD code. Please RESTART it.",
      );
    }
  } catch (error) {
    console.error("❌ Test Error:", error.message);
  }
}

testApiUpdate();
