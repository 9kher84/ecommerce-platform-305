// Test script to verify authentication error handling
const axios = require("axios");

const BASE_URL = "http://localhost:5000";

async function testAuthErrors() {
  console.log("🧪 Testing Authentication Error Handling...\n");

  // Test 1: No token
  console.log("Test 1: Request to /api/auth/me without token");
  try {
    await axios.get(`${BASE_URL}/api/auth/me`);
    console.log("❌ FAILED: Should have returned 401");
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log("✅ PASSED: Returned 401 Unauthorized");
    } else {
      console.log(
        `❌ FAILED: Returned ${error.response?.status || "unknown"} instead of 401`,
      );
    }
  }

  // Test 2: Invalid token
  console.log("\nTest 2: Request to /api/auth/me with invalid token");
  try {
    await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: {
        Cookie: "token=invalid_token_here",
      },
    });
    console.log("❌ FAILED: Should have returned 401");
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log("✅ PASSED: Returned 401 Unauthorized");
      console.log(`   Message: ${error.response.data.message}`);
    } else {
      console.log(
        `❌ FAILED: Returned ${error.response?.status || "unknown"} instead of 401`,
      );
    }
  }

  // Test 3: Categories endpoint
  console.log("\nTest 3: Request to /api/categories");
  try {
    const response = await axios.get(`${BASE_URL}/api/categories`);
    console.log("✅ PASSED: Categories endpoint is accessible");
    console.log(`   Found ${response.data.categories?.length || 0} categories`);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.log("❌ FAILED: Categories endpoint returned 404");
    } else {
      console.log(`⚠️  Error: ${error.response?.status || error.message}`);
    }
  }

  console.log("\n✅ All tests completed!");
}

testAuthErrors().catch((err) => {
  console.error("Test failed:", err.message);
  process.exit(1);
});
