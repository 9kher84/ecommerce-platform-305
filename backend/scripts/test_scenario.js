const axios = require("axios");
const { Sequelize } = require("sequelize");

const API_URL = "http://localhost:5000/api";
const SECTOR_ID = 1;

const sequelize = new Sequelize("ecommerce_db", "postgres", "sghl@hkh&fihk$", {
  host: "localhost",
  dialect: "postgres",
  logging: false,
});

async function run() {
  console.log("🚀 Starting simplified test scenario...");

  try {
    await sequelize.authenticate();
    console.log("✅ DB Connected");

    // 1. Register Buyer
    const buyerEmail = `buyer_test_${Date.now()}@example.com`;
    const bRes = await axios.post(`${API_URL}/auth/register`, {
      name: "Test Buyer",
      email: buyerEmail,
      password: "Test@123",
      role: "buyer",
      sectorIds: [SECTOR_ID],
    });
    const buyerToken = bRes.data.token || bRes.data.data?.token;
    const buyerId = bRes.data.user?.id || bRes.data.data?.user?.id;
    console.log("✅ Buyer registered.");

    // 2. Register Seller
    const sellerEmail = `seller_test_${Date.now()}@example.com`;
    const sRes = await axios.post(`${API_URL}/auth/register`, {
      name: "Test Seller",
      email: sellerEmail,
      password: "Test@123",
      role: "seller",
      sectorIds: [SECTOR_ID],
    });
    const sellerToken = sRes.data.token || sRes.data.data?.token;
    const sellerId = sRes.data.user?.id || sRes.data.data?.user?.id;
    console.log("✅ Seller registered.");

    // 3. Register Restricted User
    const restrictedEmail = `restricted_test_${Date.now()}@example.com`;
    const rRes = await axios.post(`${API_URL}/auth/register`, {
      name: "Restricted Seller",
      email: restrictedEmail,
      password: "Test@123",
      role: "seller",
      sectorIds: [SECTOR_ID],
    });
    const restrictedToken = rRes.data.token || rRes.data.data?.token;
    const restrictedId = rRes.data.user?.id || rRes.data.data?.user?.id;
    console.log("✅ Restricted user registered.");

    // Assign Roles in DB
    const [buyerRole] = await sequelize.query(
      `SELECT id FROM roles WHERE name = 'buyer'`,
    );
    const [sellerRole] = await sequelize.query(
      `SELECT id FROM roles WHERE name = 'seller'`,
    );

    await sequelize.query(
      `INSERT INTO user_roles ("userId", "roleId", "createdAt", "updatedAt") VALUES ('${buyerId}', '${buyerRole[0].id}', NOW(), NOW()) ON CONFLICT DO NOTHING;`,
    );
    await sequelize.query(
      `INSERT INTO user_roles ("userId", "roleId", "createdAt", "updatedAt") VALUES ('${sellerId}', '${sellerRole[0].id}', NOW(), NOW()) ON CONFLICT DO NOTHING;`,
    );
    await sequelize.query(
      `INSERT INTO user_roles ("userId", "roleId", "createdAt", "updatedAt") VALUES ('${restrictedId}', '${sellerRole[0].id}', NOW(), NOW()) ON CONFLICT DO NOTHING;`,
    );

    // Block restricted user
    await sequelize.query(
      `UPDATE users SET is_restricted = true WHERE id = '${restrictedId}';`,
    );
    console.log("✅ Roles assigned and restricted user blocked in DB.");

    const buyerConfig = { headers: { Authorization: `Bearer ${buyerToken}` } };
    const sellerConfig = {
      headers: { Authorization: `Bearer ${sellerToken}` },
    };
    const restrictedConfig = {
      headers: { Authorization: `Bearer ${restrictedToken}` },
    };

    // STEP C: Purchase Request
    console.log("\n--- Executing Purchase Request ---");
    const reqRes = await axios.post(
      `${API_URL}/requests`,
      {
        title: "Test Request Fix",
        description: "Testing end to end after fix",
        sectorId: SECTOR_ID,
        categoryId: 1,
        quantity: 10,
        unit: "Unit",
        delivery_city: "Riyadh",
      },
      buyerConfig,
    );
    const reqId = reqRes.data.data.id;
    console.log(`✅ Request created. ID: ${reqId}`);

    await axios.post(`${API_URL}/requests/${reqId}/publish`, {}, buyerConfig);
    console.log(`✅ Request published.`);

    // Create Quote
    console.log("\n--- Executing Quote ---");
    const quoteRes = await axios.post(
      `${API_URL}/quotes`,
      {
        purchaseRequestId: reqId,
        amount: 500,
        deliveryDate: new Date(Date.now() + 86400000),
      },
      sellerConfig,
    );
    const quoteId =
      quoteRes.data.data?.quote?.id ||
      quoteRes.data.data?.id ||
      quoteRes.data.quote?.id;
    console.log(`✅ Quote created. ID: ${quoteId}`);

    // Accept Quote
    console.log("\n--- Executing Deal ---");
    const dealRes = await axios.post(
      `${API_URL}/quotes/${quoteId}/accept`,
      { decision_reason: "Best price" },
      buyerConfig,
    );
    const dealId = dealRes.data.data?.deal?.id || dealRes.data.deal?.id;
    console.log(`✅ Deal created. ID: ${dealId}`);

    // Show Invoice Info
    const [deals] = await sequelize.query(
      `SELECT "invoiceNumber", "totalAmount", "taxAmount", "commissionAmount" FROM deals WHERE id = '${dealId}'`,
    );
    console.log(`🧾 Invoice Generated:`, deals[0]);

    // STEP D: Restricted User Quote
    console.log("\n--- Executing Restricted User Test ---");
    try {
      await axios.post(
        `${API_URL}/quotes`,
        {
          purchaseRequestId: reqId,
          amount: 400,
          deliveryDate: new Date(Date.now() + 86400000),
        },
        restrictedConfig,
      );
      console.log(
        "❌ ERROR: Restricted user succeeded but should have been blocked!",
      );
    } catch (error) {
      console.log(
        `✅ Restricted user blocked as expected! Status: ${error.response?.status}`,
      );
      console.log(
        `   Message: ${error.response?.data?.message || JSON.stringify(error.response?.data)}`,
      );
    }

    console.log("\n🏁 All tests completed successfully.");
  } catch (error) {
    console.error("\n❌ Test Failed:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error(error.message);
    }
  } finally {
    await sequelize.close();
  }
}
run();
