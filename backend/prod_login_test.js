/**
 * Step 8 & 9 only: Login + Create PR on Render Production
 * With retry for cold start
 */
const axios = require("axios");

const RENDER_URL = "https://ecommerce-platform-305.onrender.com";

async function tryLogin(attempt) {
  console.log(`Login attempt ${attempt}...`);
  try {
    const res = await axios.post(`${RENDER_URL}/api/auth/login`, {
      email: "buyer1@test.com",
      password: "Test@1234",
    }, { timeout: 45000 });
    return res;
  } catch(e) {
    console.log("  Error:", e.response?.status, e.message?.substring(0, 80));
    return null;
  }
}

async function run() {
  // Wake up Render (cold start can take 50+ seconds)
  console.log("Pinging Render to wake up...");
  try {
    await axios.get(`${RENDER_URL}/api/auth/login`, { timeout: 50000 });
  } catch(e) { /* expected */ }

  // Try login with retries
  let loginRes = null;
  for (let i = 1; i <= 3; i++) {
    loginRes = await tryLogin(i);
    if (loginRes && loginRes.status === 200) break;
    if (i < 3) await new Promise(r => setTimeout(r, 5000));
  }

  if (!loginRes || loginRes.status !== 200) {
    console.error("LOGIN FAILED after 3 attempts");
    console.log("\nFinal error body:", loginRes?.data || "no response");
    process.exit(1);
  }

  const token = loginRes.data.token;
  const user = loginRes.data.user;
  console.log("\n=== STEP 8 RESULT ===");
  console.log("Login Status: 200");
  console.log("User:", { id: user?.id, role: user?.role, email: user?.email });

  // Step 9: Create PR
  console.log("\n=== STEP 9: CREATE PURCHASE REQUEST ===");
  const payload = {
    header: {
      title: "Production E2E Test — طلب شراء اختباري",
      description: "اختبار شامل من Production",
      sectorId: 1,
      tender_type: "PUBLIC",
      pricing_method: "OPEN",
      delivery_city: "الرياض",
    },
    items: [{
      lineNumber: 1,
      freeTextDescription: "اختبار شامل من Production",
      quantity: 1,
      unit: "وحدة",
    }],
    invitations: [],
  };

  try {
    const prRes = await axios.post(`${RENDER_URL}/api/requests`, payload, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      timeout: 45000,
    });
    console.log("Status:", prRes.status);
    console.log("PR ID:", prRes.data.data?.id);
    console.log("PR Status:", prRes.data.data?.status);
    console.log("\n✅ المشكلة الأصلية في Production حُلّت بالكامل.");
  } catch(e) {
    const err = e.response?.data;
    console.error("Status:", e.response?.status);
    console.error("Body:", JSON.stringify(err, null, 2));
    // Extract first exception
    if (err?.details) {
      const lines = err.details.split('\n');
      const fileLine = lines.find(l => l.includes('.js:') && l.includes('at '));
      console.error("\nFirst exception:");
      console.error("  File+Line:", fileLine?.trim() || "see stack above");
      console.error("  Message:", err.message || lines[0]);
    } else if (err?.error) {
      console.error("\nFirst exception:");
      console.error("  Message:", err.error.message);
      if (err.error.stack) {
        const fileLine = err.error.stack.split('\n').find(l => l.includes('.js:') && l.includes('at '));
        console.error("  File+Line:", fileLine?.trim());
      }
    }
    console.log("\n❌ لا تزال المشكلة موجودة في Production، والسبب المثبت هو:", err?.message || err?.error?.message || "انظر التفاصيل أعلاه");
  }
  process.exit(0);
}

run().catch(e => { console.error("SCRIPT ERROR:", e.message); process.exit(1); });
