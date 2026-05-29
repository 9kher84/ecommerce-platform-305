const axios = require("axios");
const fs = require("fs");
const path = require("path");

const API_URL = "http://localhost:5000/api";
const SECTOR_ID = 1;

// Helper to wait
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function generate() {
  console.log("🚀 Starting Test Data Generation...");

  const users = [
    { email: "buyer1_test@example.com", name: "Buyer One", role: "buyer" },
    { email: "buyer2_test@example.com", name: "Buyer Two", role: "buyer" },
    { email: "seller1_test@example.com", name: "Seller One", role: "seller" },
    { email: "seller2_test@example.com", name: "Seller Two", role: "seller" },
    { email: "admin1_test@example.com", name: "Admin One", role: "admin" },
    { email: "admin2_test@example.com", name: "Admin Two", role: "admin" },
    {
      email: "restricted1_test@example.com",
      name: "Restricted Buyer 1",
      role: "buyer",
    },
    {
      email: "restricted2_test@example.com",
      name: "Restricted Buyer 2",
      role: "buyer",
    },
    { email: "fraud1_test@example.com", name: "Fraud User 1", role: "buyer" },
    { email: "fraud2_test@example.com", name: "Fraud User 2", role: "seller" },
  ];

  const results = {
    users: [],
    requests: [],
    quotes: [],
    deals: [],
  };

  // 1. REGISTER USERS
  console.log("\n--- 1. Registering Users ---");
  for (const u of users) {
    try {
      const res = await axios.post(`${API_URL}/auth/register`, {
        name: u.name,
        email: u.email,
        password: "Test@123",
        role: u.role === "admin" ? "buyer" : u.role, // API blocks direct admin registration
        sectorIds: [SECTOR_ID],
      });
      console.log(`✅ Registered: ${u.email}`);
      results.users.push({ ...u, id: res.data.user.id, token: res.data.token });
    } catch (err) {
      if (err.response?.status === 409) {
        console.log(`ℹ️ User ${u.email} already exists, logging in...`);
      } else {
        console.error(
          `❌ Failed to register ${u.email}:`,
          err.response?.data?.message || err.message,
        );
        if (err.response?.data?.errors) {
          console.error("Validation details:", err.response.data.errors);
        }
      }
      // Try to login
      try {
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
          email: u.email,
          password: "Test@123",
        });
        const token = loginRes.data.token;
        console.log(`FULL TOKEN: [${token}]`);

        // LOCAL TEST
        const jwt = require("jsonwebtoken");
        try {
          const decoded = jwt.verify(token, "supersecret");
          console.log("✅ Local verification SUCCESS for", u.email);
        } catch (e) {
          console.error("❌ Local verification FAILED:", e.message);
        }

        results.users.push({ ...u, id: loginRes.data.user.id, token: token });
      } catch (loginErr) {
        console.error(
          `❌ Login failed for ${u.email}:`,
          loginErr.response?.data?.message || loginErr.message,
        );
      }
    }
  }

  // 2. APPLY DB UPDATES (Admin roles and Restricted status)
  console.log("\n--- 2. Applying DB Updates (Roles/Status) ---");
  let sql = "";
  results.users.forEach((u) => {
    if (u.role === "admin") {
      sql += `UPDATE "Users" SET role = 'admin' WHERE id = '${u.id}';\n`;
    }
    if (u.email.startsWith("restricted")) {
      sql += `UPDATE "Users" SET "isActive" = false WHERE id = '${u.id}';\n`;
    }
  });
  fs.writeFileSync("update_users.sql", sql);
  console.log("✅ update_users.sql generated.");

  // 3. CREATE PURCHASE REQUESTS
  console.log("\n--- 3. Creating Purchase Requests ---");
  const activeBuyers = results.users.filter(
    (u) =>
      u.role === "buyer" &&
      !u.email.startsWith("restricted") &&
      !u.email.startsWith("fraud"),
  );

  for (const buyer of activeBuyers) {
    const count = buyer.email.includes("buyer1") ? 3 : 2;
    for (let i = 0; i < count; i++) {
      try {
        const headers = { Authorization: `Bearer ${buyer.token}` };
        const reqRes = await axios.post(
          `${API_URL}/requests`,
          {
            title: `Test Request ${i + 1} for ${buyer.name}`,
            description: `This is a test purchase request for category testing. Item ${i + 1}`,
            sectorId: SECTOR_ID,
            categoryId: 1,
            quantity: 10 + i,
            unit: "Piece",
            delivery_city: "Riyadh",
            budget: 1000 + i * 500,
          },
          { headers },
        );
        const requestId = reqRes.data.data.id;
        console.log(`✅ Created Request: ${requestId} for ${buyer.email}`);

        // Publish it
        await axios.post(
          `${API_URL}/requests/${requestId}/publish`,
          {},
          { headers },
        );
        console.log(`   🚀 Published Request: ${requestId}`);

        results.requests.push({
          id: requestId,
          buyerEmail: buyer.email,
          status: "published",
          token: buyer.token,
        });
      } catch (err) {
        console.error(
          `❌ Failed to create/publish request for ${buyer.email}:`,
          err.response?.data?.message || err.message,
        );
      }
    }
  }

  // Fraud user request
  const fraudBuyer = results.users.find(
    (u) => u.email === "fraud1_test@example.com",
  );
  if (fraudBuyer) {
    try {
      const headers = { Authorization: `Bearer ${fraudBuyer.token}` };
      const reqRes = await axios.post(
        `${API_URL}/requests`,
        {
          title: `Fraud Test Request`,
          description: `Self-trading test request`,
          sectorId: SECTOR_ID,
          categoryId: 1,
          quantity: 1,
          unit: "Piece",
          delivery_city: "Jeddah",
        },
        { headers },
      );
      const requestId = reqRes.data.data.id;
      await axios.post(
        `${API_URL}/requests/${requestId}/publish`,
        {},
        { headers },
      );
      results.requests.push({
        id: requestId,
        buyerEmail: fraudBuyer.email,
        status: "published",
        isFraud: true,
      });
      console.log(`✅ Created Fraud Test Request: ${requestId}`);
    } catch (err) {
      console.error(
        `❌ Failed to create fraud request:`,
        err.response?.data?.message || err.message,
      );
    }
  }

  // 4. SUBMIT QUOTES
  console.log("\n--- 4. Submitting Quotes ---");
  const sellers = results.users.filter((u) => u.role === "seller");
  for (const seller of sellers) {
    const headers = { Authorization: `Bearer ${seller.token}` };
    for (const req of results.requests) {
      if (req.isFraud) continue;
      try {
        const quoteRes = await axios.post(
          `${API_URL}/quotes`,
          {
            purchaseRequestId: req.id,
            amount: 800 + Math.random() * 500,
            notes: `High quality offer from ${seller.name}`,
            deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
          { headers },
        );
        console.log(
          `✅ Submitted Quote from ${seller.email} for Request ${req.id}`,
        );
        results.quotes.push({
          id: quoteRes.data.quote.id,
          sellerEmail: seller.email,
          requestId: req.id,
        });
      } catch (err) {
        console.error(
          `❌ Failed to submit quote from ${seller.email}:`,
          err.response?.data?.message || err.message,
        );
      }
    }
  }

  // 5. ACCEPT QUOTES (Create Deals)
  console.log("\n--- 5. Accepting Quotes ---");
  for (let i = 0; i < 2; i++) {
    const quote = results.quotes[i];
    if (!quote) break;
    const buyer = results.users.find(
      (u) =>
        u.email ===
        results.requests.find((r) => r.id === quote.requestId).buyerEmail,
    );
    const headers = { Authorization: `Bearer ${buyer.token}` };
    try {
      const dealRes = await axios.post(
        `${API_URL}/quotes/${quote.id}/accept`,
        {
          decision_reason: "Best price and fast delivery",
          notes: "Please confirm delivery time",
        },
        { headers },
      );
      console.log(`✅ Quote Accepted! Deal Created: ${dealRes.data.deal.id}`);
      results.deals.push(dealRes.data.deal);
    } catch (err) {
      console.error(
        `❌ Failed to accept quote ${quote.id}:`,
        err.response?.data?.message || err.message,
      );
    }
  }

  // 6. FRAUD TESTS
  console.log("\n--- 6. Running Fraud Tests ---");

  // Self Dealing
  console.log(
    "Testing Self-Dealing (fraud1_test trying to quote own request)...",
  );
  const fraud1 = results.users.find(
    (u) => u.email === "fraud1_test@example.com",
  );
  const fraudReq = results.requests.find((r) => r.isFraud);
  if (fraud1 && fraudReq) {
    try {
      await axios.post(
        `${API_URL}/quotes`,
        {
          purchaseRequestId: fraudReq.id,
          amount: 100,
        },
        {
          headers: { Authorization: `Bearer ${fraud1.token}` },
        },
      );
      console.log("❌ Error: Self-dealing should have been blocked!");
    } catch (err) {
      console.log(
        `✅ Success: Self-dealing blocked with message: "${err.response?.data?.message}"`,
      );
    }
  }

  // Rate Limiting (Should be skipped now due to DISABLE_RATE_LIMIT)
  console.log("Testing Rate Limiting bypass...");
  const fraud2 = results.users.find(
    (u) => u.email === "fraud2_test@example.com",
  );
  if (fraud2 && results.requests[0]) {
    try {
      const promises = [];
      for (let j = 0; j < 5; j++) {
        promises.push(
          axios.post(
            `${API_URL}/quotes`,
            {
              purchaseRequestId: results.requests[0].id,
              amount: 100 + j,
            },
            {
              headers: { Authorization: `Bearer ${fraud2.token}` },
            },
          ),
        );
      }
      await Promise.all(promises);
      console.log("✅ Success: Rate limiting bypassed as expected.");
    } catch (err) {
      console.log(
        `ℹ️ Rate limiting still active or other error: ${err.message}`,
      );
    }
  }

  fs.writeFileSync("generation_results.json", JSON.stringify(results, null, 2));
  console.log("\n🏁 Data Generation Finished. Check generation_results.json");
}

generate().catch(console.error);
