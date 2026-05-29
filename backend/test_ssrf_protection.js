const axios = require("axios");
const { wrapper } = require("axios-cookiejar-support");
const { CookieJar } = require("tough-cookie");

const jar = new CookieJar();
const client = wrapper(
  axios.create({
    jar,
    withCredentials: true,
    baseURL: "http://localhost:5000/api",
  }),
);

const sellerEmail = "owner@test.com"; // Role is 'seller' from previous setup
const sellerPassword = "123456";

async function runSSRFTests() {
  try {
    console.log("=== G) SSRF Protection Tests ===\n");

    // 1. Login as Seller
    console.log("--- 1. Login as Seller ---");
    try {
      const loginRes = await client.post("/auth/login", {
        email: sellerEmail,
        password: sellerPassword,
      });
      console.log("✅ Login successful. Role:", loginRes.data.user.role);
    } catch (error) {
      console.error("❌ Login failed:", error.message);
      return;
    }

    // 2. Test Internal IP Block (Localhost)
    console.log("\n--- 2. Test Internal Access (Localhost) ---");
    const internalUrl = "http://127.0.0.1:5000/api/health";
    console.log(`Attempting to upload from: ${internalUrl}`);

    try {
      await client.post("/products/upload", {
        imageUrl: internalUrl,
      });
      console.log("❌ FAIL: Internal URL was allowed!");
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log("✅ PASS: Internal URL blocked correctly (403 Forbidden)");
        console.log("   Error:", error.response.data.message);
      } else {
        console.log("⚠️ Unexpected error:", error.message);
        if (error.response) console.log("   Status:", error.response.status);
      }
    }

    // 3. Test Private IP Block
    console.log("\n--- 3. Test Private Network Access (192.168.x.x) ---");
    const privateUrl = "http://192.168.1.1/secret.jpg";
    console.log(`Attempting to upload from: ${privateUrl}`);

    try {
      await client.post("/products/upload", {
        imageUrl: privateUrl,
      });
      console.log("❌ FAIL: Private IP was allowed!");
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log("✅ PASS: Private IP blocked correctly (403 Forbidden)");
        console.log("   Error:", error.response.data.message);
      } else {
        console.log("⚠️ Unexpected error:", error.message);
        if (error.response) console.log("   Status:", error.response.status);
      }
    }

    // 4. Test External Safe URL
    console.log("\n--- 4. Test External Safe URL ---");
    // Using a reliable safe URL (Google logo or placeholder)
    const externalUrl = "https://via.placeholder.com/150";
    console.log(`Attempting to upload from: ${externalUrl}`);

    try {
      const res = await client.post("/products/upload", {
        imageUrl: externalUrl,
      });

      if (res.status === 200) {
        console.log("✅ PASS: External safe URL allowed");
        console.log("   Size:", res.data.imageSize);
      } else {
        console.log("⚠️ Unexpected success status:", res.status);
      }
    } catch (error) {
      console.log("❌ FAIL: External URL failed:", error.message);
      if (error.response) console.log("   Response:", error.response.data);
    }

    console.log("\n=== SSRF Tests Complete ===");
  } catch (error) {
    console.error("CRITICAL ERROR:", error.message);
  }
}

runSSRFTests();
