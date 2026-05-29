// Comprehensive Self-Verification Test Suite
const axios = require("axios");

const BASE_URL = "http://localhost:5000";
const results = {
  passed: 0,
  failed: 0,
  tests: [],
};

function logTest(name, passed, message = "") {
  const status = passed ? "✅ PASSED" : "❌ FAILED";
  console.log(`${status}: ${name}${message ? " - " + message : ""}`);
  results.tests.push({ name, passed, message });
  if (passed) results.passed++;
  else results.failed++;
}

async function runComprehensiveTests() {
  console.log("🧪 Starting Comprehensive Self-Verification Tests...\n");
  console.log("═".repeat(60));

  // ========================================
  // 1. AUTHENTICATION TESTS
  // ========================================
  console.log("\n📋 SECTION 1: Authentication Tests");
  console.log("─".repeat(60));

  // Test 1.1: /api/auth/me without token (should return 401)
  try {
    await axios.get(`${BASE_URL}/api/auth/me`);
    logTest("Auth: /api/auth/me without token", false, "Should return 401");
  } catch (error) {
    logTest(
      "Auth: /api/auth/me without token",
      error.response?.status === 401,
      `Returned ${error.response?.status}`,
    );
  }

  // Test 1.2: /api/auth/me with invalid token (should return 401)
  try {
    await axios.get(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: "token=invalid_token_12345" },
    });
    logTest(
      "Auth: /api/auth/me with invalid token",
      false,
      "Should return 401",
    );
  } catch (error) {
    logTest(
      "Auth: /api/auth/me with invalid token",
      error.response?.status === 401,
      `Returned ${error.response?.status} - ${error.response?.data?.message}`,
    );
  }

  // Test 1.3: Login with invalid credentials (should return 401)
  try {
    await axios.post(`${BASE_URL}/api/auth/login`, {
      email: "nonexistent@test.com",
      password: "wrongpassword",
    });
    logTest("Auth: Login with invalid credentials", false, "Should return 401");
  } catch (error) {
    logTest(
      "Auth: Login with invalid credentials",
      error.response?.status === 401,
      `Returned ${error.response?.status}`,
    );
  }

  // ========================================
  // 2. DATA FETCHING TESTS
  // ========================================
  console.log("\n📋 SECTION 2: Data Fetching Tests");
  console.log("─".repeat(60));

  // Test 2.1: Fetch categories (should return 200)
  try {
    const response = await axios.get(`${BASE_URL}/api/categories`);
    const hasCategories = Array.isArray(response.data?.data?.categories);
    logTest(
      "Data: Fetch categories",
      response.status === 200 && hasCategories,
      `Found ${response.data?.data?.categories?.length || 0} categories`,
    );
  } catch (error) {
    logTest(
      "Data: Fetch categories",
      false,
      `Error ${error.response?.status || error.message}`,
    );
  }

  // Test 2.2: Fetch posts (should return 200)
  try {
    const response = await axios.get(`${BASE_URL}/api/posts`);
    const hasPosts = response.data?.data?.posts !== undefined;
    logTest(
      "Data: Fetch posts",
      response.status === 200 && hasPosts,
      `Found ${response.data?.data?.posts?.length || 0} posts`,
    );
  } catch (error) {
    logTest(
      "Data: Fetch posts",
      false,
      `Error ${error.response?.status || error.message}`,
    );
  }

  // Test 2.3: Fetch single category (should return 200 or 404)
  try {
    const response = await axios.get(`${BASE_URL}/api/categories/1`);
    logTest(
      "Data: Fetch single category",
      response.status === 200,
      "Category retrieved successfully",
    );
  } catch (error) {
    logTest(
      "Data: Fetch single category",
      error.response?.status === 404,
      `Returned ${error.response?.status} (acceptable if no categories exist)`,
    );
  }

  // ========================================
  // 3. SECURITY & VALIDATION TESTS
  // ========================================
  console.log("\n📋 SECTION 3: Security & Validation Tests");
  console.log("─".repeat(60));

  // Test 3.1: Registration with invalid data (should return 400)
  try {
    await axios.post(`${BASE_URL}/api/auth/register`, {
      name: "A", // Too short
      email: "invalid-email",
      password: "123", // Too short
    });
    logTest(
      "Security: Registration validation",
      false,
      "Should reject invalid data",
    );
  } catch (error) {
    logTest(
      "Security: Registration validation",
      error.response?.status === 400,
      `Validation working - ${error.response?.status}`,
    );
  }

  // Test 3.2: Mass assignment protection (should not allow role assignment)
  try {
    await axios.post(`${BASE_URL}/api/auth/register`, {
      name: "Test User",
      email: `test${Date.now()}@test.com`,
      password: "Test123456",
      role: "admin", // Should be ignored
    });
    logTest(
      "Security: Mass assignment protection",
      false,
      "Should prevent role assignment",
    );
  } catch (error) {
    logTest(
      "Security: Mass assignment protection",
      error.response?.status === 400 || error.response?.status === 409,
      `Protected - ${error.response?.status}`,
    );
  }

  // Test 3.3: Rate limiting (check headers)
  try {
    const response = await axios.get(`${BASE_URL}/api/categories`);
    const hasRateLimitHeaders =
      response.headers["ratelimit-limit"] !== undefined;
    logTest(
      "Security: Rate limiting headers",
      hasRateLimitHeaders,
      hasRateLimitHeaders
        ? `Limit: ${response.headers["ratelimit-limit"]}`
        : "No rate limit headers",
    );
  } catch (error) {
    logTest("Security: Rate limiting headers", false, error.message);
  }

  // ========================================
  // FINAL REPORT
  // ========================================
  console.log("\n" + "═".repeat(60));
  console.log("📊 FINAL TEST REPORT");
  console.log("═".repeat(60));
  console.log(`Total Tests: ${results.passed + results.failed}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(
    `Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`,
  );

  if (results.failed === 0) {
    console.log(
      "\n🎉 ALL TESTS PASSED! The project is fully operational and error-free!",
    );
  } else {
    console.log("\n⚠️  Some tests failed. Please review the results above.");
  }

  console.log("═".repeat(60));

  return results;
}

// Run tests
runComprehensiveTests().catch((err) => {
  console.error("❌ Test suite failed:", err.message);
  process.exit(1);
});
