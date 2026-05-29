const baseUrl = "http://localhost:5000/api";

async function testRateLimit() {
  console.log("🚀 Starting Rate Limit Verification...");

  try {
    const res = await fetch(`${baseUrl}/health`);
    console.log("Status:", res.status);

    // Print all headers for debugging
    console.log("Headers:", Object.fromEntries(res.headers.entries()));

    // Check for standard headers (RFC)
    const limit =
      res.headers.get("RateLimit-Limit") ||
      res.headers.get("X-RateLimit-Limit");
    const remaining =
      res.headers.get("RateLimit-Remaining") ||
      res.headers.get("X-RateLimit-Remaining");

    console.log("Limit:", limit);
    console.log("Remaining:", remaining);

    if (limit && remaining) {
      console.log("✅ Rate Limit Headers present.");
      if (parseInt(limit) === 100) {
        console.log("✅ Rate Limit set to 100 as expected.");
      } else {
        console.log(`⚠️ Rate Limit is ${limit}, expected 100.`);
      }
    } else {
      console.log(
        "❌ Rate Limit Headers MISSING. Middleware might not be active.",
      );
    }
  } catch (error) {
    console.error("❌ Test Failed:", error);
  }
}

testRateLimit();
