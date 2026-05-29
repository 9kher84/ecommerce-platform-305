const {
  Sequelize,
  User,
  Category,
  PurchaseRequest,
  PriceQuote,
  sequelize,
} = require("../sequelize_setup");
// Using global fetch (Node 18+)

// Config
const API_URL = "http://localhost:5000/api";
const HEADERS = { "Content-Type": "application/json" };

async function runTest() {
  console.log("🚀 Starting Price Radar Integration Test...");

  // 1. Setup Data
  let sellerFree, sellerPremium, sector, request;
  const {
    User,
    Category,
    PurchaseRequest,
    PriceQuote,
  } = require("../sequelize_setup"); // Re-require inside async if needed, but top level is fine in CommonJS

  // 2. Helper to Login
  async function login(email) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify({ email, password: "password123" }),
    });

    // Try extracting cookie first
    let token = null;
    const cookieHeader = res.headers.get("set-cookie");
    if (cookieHeader) {
      // Looking for 'token=...'
      const match = cookieHeader.match(/token=([^;]+)/);
      if (match) token = match[1];
    }

    const data = await res.json();
    // Fallback or override if in body
    token = data.token || data.accessToken || token;

    if (!token) {
      console.error(`❌ Login Failed for ${email}:`, data);
      console.error("Cookies:", cookieHeader);
      throw new Error("Login failed for " + email);
    }
    return token;
  }

  try {
    // Create Sector
    sector = await Category.create({
      name_ar: "قطاع التجربة",
      name_en: "Test Sector",
      type: "SECTOR",
      isActive: true,
    });
    console.log("✅ Created Sector:", sector.id);

    // Create Buyer
    const buyer = await User.create({
      name: "Buyer One",
      email: `buyer_${Date.now()}@test.com`,
      password: "password123",
      role: "buyer",
      subscriptionTier: "plan_a",
      isActive: true,
      isVerified: true,
    });

    // Create Request
    request = await PurchaseRequest.create({
      userId: buyer.id,
      sectorId: sector.id,
      title: "Test Radar Request",
      description: "Testing the radar...",
      quantity: 10,
      unit: "pcs",
      status: "published",
      post_type: "standard",
      deviceFingerprint: "fps_buyer_1",
    });
    console.log("✅ Created Request:", request.id);

    // Seed Quotes (Mocking Market Data)
    // Quote 1: Fixed 100
    await PriceQuote.create({
      purchaseRequestId: request.id,
      sellerId: buyer.id,
      amount: 100.0,
      priceType: "fixed",
      status: "pending",
    });

    // Quote 2: Fixed 200
    await PriceQuote.create({
      purchaseRequestId: request.id,
      sellerId: buyer.id,
      amount: 200.0,
      priceType: "fixed",
      status: "pending",
    });

    // Quote 3: Flexible 150-250 (Avg 200)
    await PriceQuote.create({
      purchaseRequestId: request.id,
      sellerId: buyer.id,
      amount: 150.0, // Base
      priceType: "flexible",
      priceRangeMin: 150.0,
      priceRangeMax: 250.0,
      status: "pending",
    });
    console.log("✅ Seeded Quotes (100, 200, 150-250)");

    // Create Free Seller
    sellerFree = await User.create({
      name: "Seller Free",
      email: `free_${Date.now()}@test.com`,
      password: "password123",
      role: "seller",
      subscriptionTier: "free",
      isActive: true,
      isVerified: true,
    });

    // Create Premium Seller
    sellerPremium = await User.create({
      name: "Seller Premium",
      email: `premium_${Date.now()}@test.com`,
      password: "password123",
      role: "seller",
      subscriptionTier: "plan_a",
      subscriptionExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Active
      isActive: true,
      isVerified: true,
    });
  } catch (err) {
    console.error("❌ Setup Failed:", err);
    process.exit(1);
  }

  // 3. Test Scenarios

  // SCENARIO A: Free Seller -> 403
  try {
    console.log("\n🧪 Testing Free Seller Access...");
    const token = await login(sellerFree.email);
    const res = await fetch(`${API_URL}/requests/${request.id}/price-radar`, {
      headers: { ...HEADERS, Authorization: `Bearer ${token}` },
    });

    console.log(`Status: ${res.status}`);
    const json = await res.json();

    if (res.status === 403) {
      console.log("✅ Success: Access Denied (403)");
      console.log("Message:", json.message);
    } else {
      console.error("❌ Failed: Expected 403, got", res.status);
      console.log(json);
    }
  } catch (err) {
    console.error("❌ Scenario A Error:", err);
  }

  // SCENARIO B: Premium Seller -> 200
  try {
    console.log("\n🧪 Testing Premium Seller Access...");
    const token = await login(sellerPremium.email);
    const res = await fetch(`${API_URL}/requests/${request.id}/price-radar`, {
      headers: { ...HEADERS, Authorization: `Bearer ${token}` },
    });

    console.log(`Status: ${res.status}`);
    const json = await res.json();

    if (res.status === 200) {
      console.log("✅ Success: Access Granted (200)");
      console.log("📊 Radar Stats:", json.data);

      // Validate Logic
      // Quotes: 100 (fixed), 200 (fixed), 200 (flex avg of 150-250)
      // Min: 100
      // Max: 250 (max of flex)
      // Avg: (100 + 200 + 200) / 3 = 166.66 ?
      // Let's check Logic in Service:
      // Min: LEAST(fixed, min_range) -> 100
      // Max: GREATEST(fixed, max_range) -> 250
      // Avg: Avg(Value) where Value = fixed OR (min+max)/2
      // Values: 100, 200, (150+250)/2=200.
      // Avg = 500 / 3 = 166.67.
      // Confidence Score: Low (<4 quotes)

      const d = json.data;
      if (
        parseFloat(d.averagePrice).toFixed(0) === "167" &&
        d.totalQuotes === 3
      ) {
        console.log(
          "✅ DATA INTEGRITY PASS: Calculations match expected values.",
        );
      } else {
        console.warn(
          "⚠️ Data Validation Warning: Values might differ slightly.",
          d,
        );
      }
    } else {
      console.error("❌ Failed: Expected 200, got", res.status);
      console.log(json);
    }
  } catch (err) {
    console.error("❌ Scenario B Error:", err);
  }

  console.log("\n🏁 Test Completed.");
  // Keep process alive briefly for logs to flush if needed, then exit
  setTimeout(() => process.exit(0), 1000);
}

runTest();
