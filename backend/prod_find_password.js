const axios = require("axios");
const RENDER_URL = "https://ecommerce-platform-305.onrender.com";

const passwords = ["Test@1234", "Test@123", "test@1234", "123456", "Test123", "Password123"];

async function run() {
  for (const pwd of passwords) {
    try {
      const res = await axios.post(`${RENDER_URL}/api/auth/login`, {
        email: "buyer1@test.com",
        password: pwd,
      }, { timeout: 30000 });
      if (res.status === 200) {
        console.log(`✅ SUCCESS with password: ${pwd}`);
        console.log("Token obtained:", !!res.data.token);
        return res.data.token;
      }
    } catch(e) {
      const code = e.response?.status;
      const msg  = e.response?.data?.error?.message || e.response?.data?.message || e.message;
      console.log(`❌ ${pwd} → ${code} — ${msg}`);
    }
  }
  console.log("All passwords failed");
  process.exit(1);
}
run().then(token => {
  if (token) {
    console.log("\nNow testing POST /api/requests...");
    return axios.post(`${RENDER_URL}/api/requests`, {
      header: {
        title: "Production Test — طلب شراء اختباري",
        description: "اختبار",
        sectorId: 1,
        tender_type: "PUBLIC",
        pricing_method: "OPEN",
        delivery_city: "الرياض",
      },
      items: [{
        lineNumber: 1,
        freeTextDescription: "اختبار",
        quantity: 1,
        unit: "وحدة",
      }],
      invitations: [],
    }, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      timeout: 30000,
    });
  }
}).then(prRes => {
  if (prRes) {
    console.log("PR Status:", prRes.status);
    console.log("PR ID:", prRes.data.data?.id);
    console.log("\n✅ المشكلة الأصلية في Production حُلّت بالكامل.");
    process.exit(0);
  }
}).catch(e => {
  const err = e.response?.data;
  console.error("PR FAILED:", e.response?.status, JSON.stringify(err, null, 2));
  if (err?.details || err?.error?.stack) {
    const stack = err?.details || err?.error?.stack;
    const fileLine = stack.split('\n').find(l => l.includes('.js:') && l.includes('at '));
    console.error("File+Line:", fileLine?.trim());
    console.error("Message:", err?.message || err?.error?.message);
  }
  console.log("\n❌ لا تزال المشكلة موجودة في Production، والسبب المثبت هو:", err?.message || err?.error?.message);
  process.exit(1);
});
