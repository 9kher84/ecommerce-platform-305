const axios = require("axios");
const baseURL = "http://localhost:5000/api";

(async () => {
  try {
    console.log("--- 1. Testing API Rate Limit ---");
    try {
      const res = await axios.get(`${baseURL}/health`);
      console.log("Health Check Status:", res.status);
      console.log("RateLimit-Limit:", res.headers["ratelimit-limit"]);

      if (res.headers["ratelimit-limit"]) {
        console.log(
          `✅ API Limit Header Found: ${res.headers["ratelimit-limit"]}`,
        );
      } else {
        console.log(
          "❌ API Limit Header MISSING on /api/health (Might be path mismatch?)",
        );
      }
    } catch (e) {
      console.log("API Request Failed:", e.message);
    }

    console.log("\n--- 2. Testing Login Rate Limit ---");
    try {
      const res = await axios.post(
        `${baseURL}/auth/login`,
        { email: "test@test.com", password: "wrong" },
        { validateStatus: () => true },
      );
      console.log("Status:", res.status);
      console.log("RateLimit-Limit:", res.headers["ratelimit-limit"]);

      if (res.headers["ratelimit-limit"] === "100") {
        console.log("✅ PASS: Login Limit is 100 (DEV Mode).");
      } else if (res.headers["ratelimit-limit"] === "5") {
        console.log("✅ PASS: Login Limit is 5 (PROD Mode).");
      } else {
        console.log(
          "⚠️ WARNING: Unexpected Login Limit header:",
          res.headers["ratelimit-limit"],
        );
      }
    } catch (e) {
      console.log("Login Request Failed:", e.message);
    }

    console.log(
      "\n--- 3. Testing /api/auth/register (Should match API Limit 1000) ---",
    );
    try {
      const res = await axios.post(
        `${baseURL}/auth/register`,
        {},
        { validateStatus: () => true },
      );
      console.log("Register Status:", res.status);
      console.log("RateLimit-Limit:", res.headers["ratelimit-limit"]);
    } catch (e) {
      console.log("Register Request Failed:", e.message);
    }
  } catch (error) {
    console.error("CRITICAL:", error);
  }
})();
