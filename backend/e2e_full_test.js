/**
 * Full E2E Test:
 * 1. Login
 * 2. Create PurchaseRequest → expect 201
 * 3. Verify record in DB (correct table: "PurchaseRequests")
 * 4. Call Dashboard API → confirm total count > 0
 */
const axios = require("axios");
const { sequelize } = require("./sequelize_setup");

const BASE = "http://localhost:5000";

async function run() {

  // ── Step 1: Login ──────────────────────────────────────────────
  console.log("=== STEP 1: LOGIN ===");
  const loginRes = await axios.post(`${BASE}/api/auth/login`, {
    email: "testbuyer@test.com",
    password: "Test@1234",
  });
  console.log("Status:", loginRes.status);
  const token  = loginRes.data.token;
  const userId = loginRes.data.user.id;
  const role   = loginRes.data.user.role;
  console.log(`User: ${loginRes.data.user.email} | role: ${role} | id: ${userId}`);

  // ── Step 2: POST /api/requests ─────────────────────────────────
  console.log("\n=== STEP 2: CREATE PURCHASE REQUEST ===");
  const payload = {
    header: {
      title: "E2E Full Test — طلب شراء اختباري",
      description: "اختبار شامل من النظام",
      sectorId: 1,
      tender_type: "PUBLIC",
      pricing_method: "OPEN",
      delivery_city: "الرياض",
    },
    items: [{
      lineNumber: 1,
      freeTextDescription: "اختبار شامل من النظام",
      quantity: 5,
      unit: "وحدة",
    }],
    invitations: [],
  };

  const prRes = await axios.post(`${BASE}/api/requests`, payload, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  console.log("Status:", prRes.status);
  const prId     = prRes.data.data.id;
  const prTitle  = prRes.data.data.title;
  const prStatus = prRes.data.data.status;
  console.log(`PR ID: ${prId}`);
  console.log(`Title: ${prTitle}`);
  console.log(`Status: ${prStatus}`);

  // ── Step 3: Verify in Database ─────────────────────────────────
  console.log("\n=== STEP 3: VERIFY IN DATABASE ===");
  await sequelize.authenticate();

  // PurchaseRequest model has no tableName → Sequelize uses "PurchaseRequests"
  const [rows] = await sequelize.query(
    `SELECT id, title, status FROM "PurchaseRequests" WHERE id = '${prId}'`
  );
  if (rows.length > 0) {
    console.log("✅ DB record confirmed:", rows[0]);
  } else {
    console.log("❌ Record NOT found in \"PurchaseRequests\"");
    // Fallback: check lowercase table
    const [rows2] = await sequelize.query(
      `SELECT id, title, status FROM purchase_requests WHERE id = '${prId}'`
    );
    console.log("purchase_requests result:", rows2.length > 0 ? rows2[0] : "NOT FOUND");
  }

  // ── Step 4: Dashboard API ──────────────────────────────────────
  console.log("\n=== STEP 4: BUYER DASHBOARD SUMMARY ===");
  const dashRes = await axios.get(`${BASE}/api/dashboard/buyer/summary`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log("Dashboard Status:", dashRes.status);
  const s = dashRes.data.summary;
  console.log(`RFQ → Total: ${s.rfq.total} | Drafts: ${s.rfq.drafts} | Active: ${s.rfq.active}`);
  console.log(`Quotes → Received: ${s.quotes.received}`);
  console.log(`Deals  → In Progress: ${s.deals.in_progress}`);

  if (s.rfq.total > 0) {
    console.log(`\n✅ SUCCESS: Dashboard shows ${s.rfq.total} request(s) for this buyer`);
  } else {
    console.log("\n⚠️  Dashboard total = 0 — userId mismatch between PR and dashboard query");
  }

  await sequelize.close();
  process.exit(0);
}

run().catch(async (e) => {
  console.error("FAILED:", e.response?.status, JSON.stringify(e.response?.data) || e.message);
  try { await sequelize.close(); } catch (_) {}
  process.exit(1);
});
