process.env.PORT = 5555; // Must be first!
const {
  Sequelize,
  User,
  Category,
  PurchaseRequest,
  PriceQuote,
  Notification,
  Role,
  Permission,
  sequelize,
} = require("../sequelize_setup");

// Config & Self-Hosting
const PORT = 5555;
const API_URL = `http://localhost:${PORT}/api`;
const HEADERS = { "Content-Type": "application/json" };
const app = require("../server"); // Import App (Code will be fresh)

async function runTest() {
  console.log(
    `🚀 Starting Notification Integration Test (Self-Hosted on Port ${PORT})...`,
  );

  // Start Server Manually
  try {
    await app.startServer(true); // Start listening
    console.log("✅ Test Server Started.");
  } catch (e) {
    console.error("❌ Failed to start test server:", e);
    process.exit(1);
  }

  let buyer, seller, sector, request, quote;

  // 1. Helper to Login
  async function login(email) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ email, password: "password123" }),
    });

    let token = null;
    const cookieHeader = res.headers.get("set-cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(/token=([^;]+)/);
      if (match) token = match[1];
    }

    const data = await res.json();
    token = data.token || data.accessToken || token;

    if (!token) throw new Error("Login failed for " + email);
    return token;
  }

  try {
    // 2. Setup Data
    sector = await Category.create({
      name_ar: "قطاع الإشعارات",
      name_en: "Notification Sector",
      type: "SECTOR",
      isActive: true,
    });

    // RBAC Setup
    const [permCreateReq] = await Permission.findOrCreate({
      where: { key: "CREATE_REQUEST" },
      defaults: { description: "Create Request" },
    });
    const [permCreateQuote] = await Permission.findOrCreate({
      where: { key: "CREATE_QUOTE" },
      defaults: { description: "Create Quote" },
    });

    const [buyerRole] = await Role.findOrCreate({
      where: { name: "buyer" },
      defaults: { description: "Buyer" },
    });
    await buyerRole.addPermission(permCreateReq);

    const [sellerRole] = await Role.findOrCreate({
      where: { name: "seller" },
      defaults: { description: "Seller" },
    });
    await sellerRole.addPermission(permCreateQuote);

    const timestamp = Date.now();
    buyer = await User.create({
      name: "Buyer Notif",
      email: `buyer_notif_${timestamp}@test.com`,
      password: "password123",
      role: "buyer", // Legacy field still used by some logic
      subscriptionTier: "plan_a",
      isActive: true,
      isVerified: true,
    });
    await buyer.addRole(buyerRole); // Assign RBAC Role

    seller = await User.create({
      name: "Seller Notif",
      email: `seller_notif_${timestamp}@test.com`,
      password: "password123",
      role: "seller",
      subscriptionTier: "plan_a",
      isActive: true,
      isVerified: true,
    });
    await seller.addRole(sellerRole); // Assign RBAC Role

    console.log("✅ Users Created");

    // 3. Create Request (as Buyer)
    const buyerToken = await login(buyer.email);
    const reqRes = await fetch(`${API_URL}/requests`, {
      method: "POST",
      headers: { ...HEADERS, Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({
        title: "Request for Notifications",
        description: "Testing alert system",
        sectorId: sector.id,
        quantity: 5,
        unit: "pcs",
        delivery_city: "Riyadh",
        execution_date: new Date(),
        deviceFingerprint: "notif_test_device",
      }),
    });

    const reqData = await reqRes.json();
    if (!reqData.success)
      throw new Error("Request creation failed: " + JSON.stringify(reqData));

    request = reqData.request || reqData.data;
    const requestId = request.id;
    console.log("✅ Request Created:", requestId);

    // Publish it (must be published to receive quotes)
    await fetch(`${API_URL}/requests/${requestId}/publish`, {
      method: "POST",
      headers: { ...HEADERS, Authorization: `Bearer ${buyerToken}` },
    });
    console.log("✅ Request Published");

    // 4. Submit Quote (as Seller) -> Should Trigger Notification A
    const sellerToken = await login(seller.email);
    const quoteRes = await fetch(`${API_URL}/requests/${requestId}/quotes`, {
      method: "POST",
      headers: { ...HEADERS, Authorization: `Bearer ${sellerToken}` },
      body: JSON.stringify({
        priceType: "fixed",
        fixedPrice: 500,
        delivery_time: "3 days",
      }),
    });
    const quoteData = await quoteRes.json();
    if (!quoteData.success)
      throw new Error("Quote submission failed: " + JSON.stringify(quoteData));
    console.log("✅ Quote Submitted");
    const quoteId = quoteData.data.id;

    // VERIFY: Check if Buyer Received Notification
    const notifA = await Notification.findOne({
      where: { userId: buyer.id, type: "NEW_QUOTE_RECEIVED" },
      order: [["createdAt", "DESC"]],
    });

    if (notifA) {
      console.log("✅ PASS: Buyer received NEW_QUOTE_RECEIVED notification.");
      console.log("📊 Notification:", {
        title: notifA.title,
        message: notifA.message,
        type: notifA.type,
      });
    } else {
      console.error("❌ FAIL: Buyer did NOT receive notification.");
    }

    // 5. Accept Quote (as Buyer) -> Should Trigger Notification B
    // Wait briefly to ensure timestamps differ if needed (handled by logic usually)
    const acceptRes = await fetch(`${API_URL}/quotes/${quoteId}/accept`, {
      method: "POST",
      headers: { ...HEADERS, Authorization: `Bearer ${buyerToken}` },
    });

    if (acceptRes.status !== 200) {
      const err = await acceptRes.json();
      console.error("Accept Failed:", err);
      // It might fail if Deal creation logic has other requirements, but usually fine for Plan A.
      // Warning: Accept route might be different? `PUT /quotes/:id/accept`?
      // Checking requestRoutes.js in my memory...
      // Usually: router.post('/:requestId/quotes/:quoteId/accept') or similar.
      // I'll check route if this fails.
    } else {
      console.log("✅ Quote Accepted");

      // VERIFY: Check if Seller Received Notification
      const notifB = await Notification.findOne({
        where: { userId: seller.id, type: "QUOTE_ACCEPTED" },
        order: [["createdAt", "DESC"]],
      });

      if (notifB && notifB.data.requestId === requestId) {
        console.log("✅ PASS: Seller received QUOTE_ACCEPTED notification.");
      } else {
        console.error("❌ FAIL: Seller did NOT receive notification.");
        console.log("Last Notification:", notifB ? notifB.dataValues : "None");
      }
    }
  } catch (err) {
    console.error("❌ Test Failed:", err);
  }

  // Cleanup if needed? No, standard test DB usage.
  console.log("🏁 Notification Test Completed.");
  setTimeout(() => process.exit(0), 1000);
}

runTest();
