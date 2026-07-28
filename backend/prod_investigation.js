/**
 * Production Investigation Script
 * DB: Neon (production) - ep-rapid-river-ap7l6xha-pooler
 * API: https://ecommerce-platform-305.onrender.com
 */
const { Sequelize } = require("sequelize");
const axios = require("axios");

const PROD_DB_URL = "postgresql://neondb_owner:npg_hudwpP4y8bvU@ep-rapid-river-ap7l6xha-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require";
const RENDER_URL = "https://ecommerce-platform-305.onrender.com";

const seq = new Sequelize(PROD_DB_URL, { dialect: "postgres", logging: false, dialectOptions: { ssl: { require: true, rejectUnauthorized: false } } });

async function run() {
  await seq.authenticate();
  console.log("✅ Connected to Production Neon DB\n");

  // ── Step 4 & 5: Find buyer1@test.com ─────────────────────────
  console.log("=== BUYER1@TEST.COM USER INFO ===");
  const [users] = await seq.query(
    `SELECT id, email, role, "weeklyPostCount", "deletedAt" FROM users WHERE email = 'buyer1@test.com' LIMIT 1`
  );
  if (users.length === 0) {
    console.log("User NOT FOUND in production DB");
  } else {
    console.log(JSON.stringify(users[0], null, 2));
  }
  const userId = users[0]?.id;

  // ── Step 6: UserCategory records ─────────────────────────────
  console.log("\n=== USER_CATEGORY RECORDS ===");
  if (userId) {
    try {
      const [cats] = await seq.query(
        `SELECT * FROM "UserCategories" WHERE "userId" = '${userId}'`
      );
      if (cats.length === 0) {
        const [cats2] = await seq.query(
          `SELECT * FROM user_categories WHERE user_id = '${userId}'`
        );
        console.log("user_categories (lowercase):", cats2.length > 0 ? cats2 : "EMPTY");
      } else {
        console.log("UserCategories:", cats);
      }
    } catch(e) {
      console.log("UserCategories query error:", e.message);
    }
  }

  // ── Step 7: PurchaseRequests for this user ────────────────────
  console.log("\n=== PURCHASE_REQUESTS FOR BUYER ===");
  if (userId) {
    try {
      const [prs] = await seq.query(
        `SELECT id, title, status, "createdAt" FROM "PurchaseRequests" WHERE "userId" = '${userId}' ORDER BY "createdAt" DESC LIMIT 5`
      );
      console.log("PurchaseRequests count:", prs.length);
      prs.forEach(r => console.log(" -", r.id, "|", r.status, "|", r.title));
    } catch(e) {
      console.log("PurchaseRequests error:", e.message);
    }
  }

  await seq.close();

  // ── Step 8: Login on Render ───────────────────────────────────
  console.log("\n=== STEP 8: LOGIN ON RENDER PRODUCTION ===");
  let token;
  try {
    const loginRes = await axios.post(`${RENDER_URL}/api/auth/login`, {
      email: "buyer1@test.com",
      password: "Test@1234",
    }, { timeout: 30000 });
    console.log("Login Status:", loginRes.status);
    console.log("User:", { id: loginRes.data.user?.id, role: loginRes.data.user?.role, email: loginRes.data.user?.email });
    token = loginRes.data.token;
  } catch(e) {
    console.error("LOGIN FAILED:", e.response?.status, JSON.stringify(e.response?.data));
    process.exit(1);
  }

  // ── Step 9: Create Purchase Request ──────────────────────────
  console.log("\n=== STEP 9: CREATE PURCHASE REQUEST ON RENDER PRODUCTION ===");
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
      timeout: 30000,
    });
    console.log("Create PR Status:", prRes.status);
    console.log("PR ID:", prRes.data.data?.id);
    console.log("PR Status:", prRes.data.data?.status);
    console.log("\n✅ المشكلة الأصلية في Production حُلّت بالكامل.");
  } catch(e) {
    const err = e.response?.data;
    console.error("CREATE PR FAILED:", e.response?.status);
    console.error("Error:", JSON.stringify(err, null, 2));
    if (err?.details) {
      // Extract file and line from stack
      const stackLine = err.details.split('\n').find(l => l.includes('.js:'));
      console.error("First exception line:", stackLine?.trim());
    }
    console.log("\n❌ لا تزال المشكلة موجودة في Production، والسبب المثبت هو:", err?.message || err?.error?.message || "انظر التفاصيل أعلاه");
  }

  process.exit(0);
}

run().catch(e => { console.error("SCRIPT ERROR:", e.message); process.exit(1); });
