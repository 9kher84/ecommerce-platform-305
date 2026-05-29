const axios = require("axios");
const {
  Organization,
  OrganizationUser,
  User,
  PurchaseRequest,
  PriceQuote,
  Deal,
  AuditLog,
  Category,
  sequelize,
} = require("../sequelize_setup");
const { v4: uuidv4 } = require("uuid");

const API_URL = "http://localhost:5000/api";

async function runTest() {
  console.log(
    "🚀 Starting Integration Test for Organizations and Audit Logs...",
  );

  let buyerToken, sellerToken;
  let buyerId, sellerId;
  let requestId, quoteId;
  let sectorId;

  try {
    // 0. Setup: Find a valid sector
    const [sectors] = await sequelize.query(
      "SELECT id FROM \"Categories\" WHERE type = 'SECTOR' LIMIT 1",
    );
    if (sectors.length === 0) {
      // Create one if not exists (Categories use SERIAL id)
      const [result] = await sequelize.query(
        `INSERT INTO "Categories" (name_ar, name_en, type, "isActive", "createdAt", "updatedAt") VALUES ('Test Sector', 'Test Sector', 'SECTOR', true, NOW(), NOW()) RETURNING id`,
      );
      sectorId = result[0].id;
    } else {
      sectorId = sectors[0].id;
    }
    console.log(`Using Sector ID: ${sectorId}`);

    // 1. Test Registration
    console.log("\n--- 1. Testing Registration ---");
    const buyerEmail = `buyer_${Date.now()}@test.com`;
    const buyerRes = await axios.post(`${API_URL}/auth/register`, {
      name: "Test Buyer",
      email: buyerEmail,
      password: "Password123!",
      role: "buyer",
      sectorIds: [sectorId],
    });
    buyerToken = buyerRes.data.token;
    buyerId = buyerRes.data.user.id;
    console.log("✅ Buyer registered");

    const sellerEmail = `seller_${Date.now()}@test.com`;
    const sellerRes = await axios.post(`${API_URL}/auth/register`, {
      name: "Test Seller",
      email: sellerEmail,
      password: "Password123!",
      role: "seller",
      sectorIds: [sectorId],
    });
    sellerToken = sellerRes.data.token;
    sellerId = sellerRes.data.user.id;
    console.log("✅ Seller registered");

    // Check organization assignment
    const buyerOrgUser = await OrganizationUser.findOne({
      where: { user_id: buyerId, is_primary: true },
    });
    if (buyerOrgUser) {
      console.log(
        `✅ Buyer assigned to organization: ${buyerOrgUser.organization_id}`,
      );
    } else {
      throw new Error("Buyer NOT assigned to organization");
    }

    // 2. Test RFQ Creation
    console.log("\n--- 2. Testing RFQ Creation ---");
    const rfqRes = await axios.post(
      `${API_URL}/requests`,
      {
        title: "Test RFQ",
        description: "Test Description",
        quantity: 10,
        unit: "pcs",
        sectorId: sectorId,
      },
      {
        headers: { Authorization: `Bearer ${buyerToken}` },
      },
    );
    requestId = rfqRes.data.data.id;

    const rfq = await PurchaseRequest.findByPk(requestId);
    if (rfq.organization_id === buyerOrgUser.organization_id) {
      console.log("✅ RFQ saved with correct organization_id");
    } else {
      throw new Error(
        `RFQ organization_id mismatch: ${rfq.organization_id} vs ${buyerOrgUser.organization_id}`,
      );
    }

    // 3. Test Quote Submission
    console.log("\n--- 3. Testing Quote Submission ---");
    // Need to publish request first (use buyer token)
    await axios.put(
      `${API_URL}/requests/${requestId}/status`,
      {
        status: "published",
      },
      {
        headers: { Authorization: `Bearer ${buyerToken}` },
      },
    );

    const quoteRes = await axios.post(
      `${API_URL}/quotes`,
      {
        purchaseRequestId: requestId,
        amount: 100,
        currency: "SAR",
        notes: "Test Quote",
      },
      {
        headers: { Authorization: `Bearer ${sellerToken}` },
      },
    );
    quoteId = quoteRes.data.quote.id;

    const sellerOrgUser = await OrganizationUser.findOne({
      where: { user_id: sellerId, is_primary: true },
    });
    const quote = await PriceQuote.findByPk(quoteId);
    if (quote.organization_id === sellerOrgUser.organization_id) {
      console.log("✅ Quote saved with correct organization_id");
    } else {
      throw new Error("Quote organization_id mismatch");
    }

    // 4. Test Quote Acceptance
    console.log("\n--- 4. Testing Quote Acceptance ---");
    const acceptRes = await axios.post(
      `${API_URL}/quotes/${quoteId}/accept`,
      {
        decision_reason: "Price is good",
        notes: "Accepting this",
      },
      {
        headers: { Authorization: `Bearer ${buyerToken}` },
      },
    );
    const dealId = acceptRes.data.deal.id;

    const deal = await Deal.findByPk(dealId);
    if (deal.organization_id === buyerOrgUser.organization_id) {
      console.log("✅ Deal created with correct organization_id");
    } else {
      throw new Error("Deal organization_id mismatch");
    }

    // 5. Test Audit Logs
    console.log("\n--- 5. Testing Audit Logs ---");
    const logs = await AuditLog.findAll({
      where: { user_id: buyerId },
      order: [["created_at", "DESC"]],
    });
    console.log(`Found ${logs.length} logs for buyer`);
    const actions = logs.map((l) => l.action);
    console.log("Actions logged:", actions);

    if (
      actions.includes("CREATE_REQUEST") &&
      actions.includes("ACCEPT_QUOTE")
    ) {
      console.log("✅ Audit logs for CREATE_REQUEST and ACCEPT_QUOTE found");
    } else {
      throw new Error("Required audit logs not found");
    }

    const sellerLogs = await AuditLog.findAll({
      where: { user_id: sellerId },
    });
    if (sellerLogs.some((l) => l.action === "SUBMIT_QUOTE")) {
      console.log("✅ Audit log for SUBMIT_QUOTE found");
    } else {
      throw new Error("SUBMIT_QUOTE audit log not found");
    }

    console.log("\n🌟 ALL TESTS PASSED! 🌟");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ TEST FAILED ❌");
    if (error.response) {
      console.error(
        "Response Error:",
        JSON.stringify(error.response.data, null, 2),
      );
    } else {
      console.error("Error:", error.message);
      console.error(error.stack);
    }
    process.exit(1);
  }
}

runTest();
