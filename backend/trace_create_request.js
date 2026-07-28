/**
 * Runtime Trace: POST /api/requests
 * Simulates exactly what the frontend sends.
 */
const axios = require("axios");

const BASE = "http://localhost:5000";

async function run() {
  // Step 1: Login as buyer1@test.com
  console.log("\n=== STEP 1: LOGIN ===");
  let token;
  try {
    const loginRes = await axios.post(`${BASE}/api/auth/login`, {
      email: "testbuyer@test.com",
      password: "Test@1234",
    }, { withCredentials: true });

    console.log("Login status:", loginRes.status);
    console.log("Login user:", JSON.stringify(loginRes.data.user, null, 2));
    token = loginRes.data.token;
    console.log("Token obtained:", token ? "YES" : "NO");
  } catch (e) {
    console.error("LOGIN FAILED:", e.response?.status, JSON.stringify(e.response?.data));
    process.exit(1);
  }

  // Step 2: POST /api/requests with minimal valid payload
  console.log("\n=== STEP 2: POST /api/requests ===");
  const payload = {
    header: {
      title: "Test PR from trace script",
      description: "Test description",
      sectorId: 1,
      quantity: 10,
      unit: "unit",
      delivery_city: "Riyadh",
      status: "draft",
    },
    items: [
      {
        lineNumber: 1,
        freeTextDescription: "Test item",
        quantity: 10,
        unit: "unit",
      }
    ],
    invitations: [],
  };

  console.log("Payload being sent:", JSON.stringify(payload, null, 2));

  try {
    const prRes = await axios.post(`${BASE}/api/requests`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    console.log("\n=== SUCCESS ===");
    console.log("Status:", prRes.status);
    console.log("Response:", JSON.stringify(prRes.data, null, 2));
  } catch (e) {
    console.error("\n=== POST FAILED ===");
    console.error("Status:", e.response?.status);
    console.error("Headers sent:", e.config?.headers);
    console.error("Error body:", JSON.stringify(e.response?.data, null, 2));
  }

  process.exit(0);
}

run().catch(console.error);
