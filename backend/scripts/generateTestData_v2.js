const axios = require("axios");
const { wrapper } = require("axios-cookiejar-support");
const { CookieJar } = require("tough-cookie");
const fs = require("fs");
const path = require("path");

const jar = new CookieJar();
const client = wrapper(
  axios.create({
    baseURL: "http://localhost:5000/api",
    jar,
    withCredentials: true,
  }),
);

const SECTOR_ID = 1;
const API_URL = "http://localhost:5000/api";

async function generate() {
  console.log("🚀 Starting Test Data Generation (with Cookie Support)...");

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

  // 1. LOGIN/REGISTER USERS
  console.log("\n--- 1. Auth Phase ---");
  for (const u of users) {
    try {
      // Clear jar for each user to get a clean session if needed, but we'll store tokens
      const userJar = new CookieJar();
      const userClient = wrapper(
        axios.create({
          baseURL: "http://localhost:5000/api/",
          jar: userJar,
          withCredentials: true,
        }),
      );

      let res;
      try {
        res = await userClient.post("/auth/register", {
          name: u.name,
          email: u.email,
          password: "Test@123",
          role: u.role === "admin" ? "buyer" : u.role,
          sectorIds: [SECTOR_ID],
        });
        console.log(`✅ Registered: ${u.email}`);
      } catch (err) {
        if (err.response?.status === 409) {
          res = await userClient.post("/auth/login", {
            email: u.email,
            password: "Test@123",
          });
          console.log(`✅ Logged in: ${u.email}`);
        } else {
          throw err;
        }
      }

      results.users.push({
        ...u,
        id: res.data.user.id,
        token: res.data.token,
        client: userClient,
      });
    } catch (err) {
      console.error(
        `❌ Auth failed for ${u.email}:`,
        err.response?.data?.message || err.message,
      );
    }
  }

  // 2. APPLY DB UPDATES
  console.log("\n--- 2. SQL Phase ---");
  let sql = "";
  results.users.forEach((u) => {
    if (u.role === "admin")
      sql += `UPDATE "Users" SET role = 'admin' WHERE id = '${u.id}';\n`;
    if (u.email.startsWith("restricted"))
      sql += `UPDATE "Users" SET "isActive" = false WHERE id = '${u.id}';\n`;
  });
  fs.writeFileSync("update_users.sql", sql);
  console.log("✅ update_users.sql generated.");

  // 3. PURCHASE REQUESTS
  console.log("\n--- 3. Request Phase ---");
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
        const reqRes = await buyer.client.post(`${API_URL}/requests`, {
          title: `Request ${i + 1} - ${buyer.name}`,
          description: `Testing item ${i + 1}`,
          sectorId: SECTOR_ID,
          categoryId: 1,
          quantity: 5,
          unit: "Unit",
          delivery_city: "Riyadh",
        });
        const requestId = reqRes.data.data.id;
        await buyer.client.post(`${API_URL}/requests/${requestId}/publish`);
        console.log(`✅ Published Request: ${requestId} for ${buyer.email}`);
        results.requests.push({ id: requestId, buyerEmail: buyer.email });
      } catch (err) {
        console.error(
          `❌ Request failed for ${buyer.email}:`,
          err.response?.data?.message || err.message,
        );
      }
    }
  }

  // Fraud Request
  const f1 = results.users.find((u) => u.email === "fraud1_test@example.com");
  if (f1) {
    try {
      const reqRes = await f1.client.post(`${API_URL}/requests`, {
        title: "Fraud Test",
        sectorId: SECTOR_ID,
        categoryId: 1,
        quantity: 1,
        unit: "Unit",
        delivery_city: "Jeddah",
      });
      const rid = reqRes.data.data.id;
      await f1.client.post(`${API_URL}/requests/${rid}/publish`);
      results.requests.push({ id: rid, buyerEmail: f1.email, isFraud: true });
      console.log(`✅ Fraud Request Created: ${rid}`);
    } catch (err) {
      console.error("❌ Fraud req failed");
    }
  }

  // 4. QUOTES
  console.log("\n--- 4. Quote Phase ---");
  const sellers = results.users.filter((u) => u.role === "seller");
  for (const seller of sellers) {
    for (const req of results.requests) {
      if (req.isFraud) continue;
      try {
        const qRes = await seller.client.post(`${API_URL}/quotes`, {
          purchaseRequestId: req.id,
          amount: 500,
          deliveryDate: new Date(Date.now() + 86400000),
        });
        console.log(`✅ Quote from ${seller.email} for ${req.id}`);
        results.quotes.push({
          id: qRes.data.quote.id,
          sellerEmail: seller.email,
          requestId: req.id,
        });
      } catch (err) {
        console.error(`❌ Quote failed: ${err.message}`);
      }
    }
  }

  // 5. DEALS
  console.log("\n--- 5. Deal Phase ---");
  if (results.quotes.length > 0) {
    const q = results.quotes[0];
    const b = results.users.find(
      (u) =>
        u.email ===
        results.requests.find((r) => r.id === q.requestId).buyerEmail,
    );
    try {
      const dRes = await b.client.post(`${API_URL}/quotes/${q.id}/accept`, {
        decision_reason: "Test",
      });
      console.log(`✅ Deal Created: ${dRes.data.deal.id}`);
    } catch (err) {
      console.error(`❌ Deal failed: ${err.message}`);
    }
  }

  console.log("\n🏁 Finished.");
}

generate().catch(console.error);
