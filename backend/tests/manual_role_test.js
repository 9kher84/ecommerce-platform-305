const axios = require("axios");

const API_URL = "http://localhost:5000/api";

// Test Credentials (from seed_test_data.js)
const BUYER_FREE = {
  email: "buyer_free@test.com",
  password: "password123",
};

const runTest = async () => {
  console.log("🧪 Starting Unit Test: Role Restrictions for Buyer Free");
  console.log("=====================================================");

  let token;

  // 1. Login
  try {
    console.log("🔹 Logging in as Buyer (Free)...");
    const loginRes = await axios.post(`${API_URL}/auth/login`, BUYER_FREE);
    token = loginRes.data.token;
    console.log("✅ Login successful");
  } catch (error) {
    console.error(
      "❌ Login failed:",
      error.response ? error.response.data : error.message,
    );
    process.exit(1);
  }

  const config = {
    headers: { Authorization: `Bearer ${token}` },
  };

  // Helper to log error details
  const logError = (error) => {
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Message: ${JSON.stringify(error.response.data)}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
  };

  // 2. Test Secret Auction Restriction
  console.log(
    "\n🔹 Test Case 1: Attempting to create SECRET auction (Should Fail)...",
  );
  try {
    await axios.post(
      `${API_URL}/requests`,
      {
        title: "Test Secret Request Full Data",
        description:
          "This is a complete request description to pass validation",
        categoryId: 1,
        quantity: 10,
        unit: "pcs",
        deliveryDates: [new Date().toISOString()],
        delivery_city: "Riyadh", // Added required field
        auction_type: "secret", // Forbidden for Free
      },
      config,
    );

    console.error(
      "❌ FAILED: Request was created but should have been forbidden!",
    );
  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.log("✅ PASSED: Server rejected with 403 Forbidden as expected.");
      console.log(`   Reason: ${error.response.data.message}`);
    } else {
      console.error("❌ FAILED: Unexpected error code.");
      logError(error);
    }
  }

  // 3. Test Direct Purchase Restriction
  console.log(
    "\n🔹 Test Case 2: Attempting to create DIRECT purchase (Should Fail)...",
  );
  try {
    await axios.post(
      `${API_URL}/requests`,
      {
        title: "Test Direct Request Full Data",
        description:
          "This is a complete request description to pass validation",
        categoryId: 1,
        quantity: 10,
        unit: "pcs",
        deliveryDates: [new Date().toISOString()],
        delivery_city: "Jeddah", // Added required field
        post_type: "direct", // Forbidden for Free
        directPurchase: true,
        targetSellerId: 1, // Dummy ID
      },
      config,
    );

    console.error(
      "❌ FAILED: Request was created but should have been forbidden!",
    );
  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.log("✅ PASSED: Server rejected with 403 Forbidden as expected.");
      console.log(`   Reason: ${error.response.data.message}`);
    } else {
      console.error("❌ FAILED: Unexpected error code.");
      logError(error);
    }
  }

  console.log("\n=====================================================");
  console.log("🏁 Test Completed");
};

runTest();
