const axios = require("axios");
const { wrapper } = require("axios-cookiejar-support");
const { CookieJar } = require("tough-cookie");

const jar = new CookieJar();
const client = wrapper(
  axios.create({
    jar,
    withCredentials: true,
    baseURL: "http://localhost:5000/api/auth",
  }),
);

const email = "owner@test.com"; // Assuming this user exists and is active
const password = "123456";

async function runTest() {
  try {
    console.log("--- 1. Login ---");
    const loginResponse = await client.post("/login", { email, password });
    console.log("Login Status:", loginResponse.status);
    console.log("Response Body Keys:", Object.keys(loginResponse.data));

    const refreshToken1 = loginResponse.data.refreshToken;
    if (!refreshToken1) {
      console.error("❌ FAIL: No refreshToken returned in login response");
      return;
    }
    console.log("✅ PASS: Login successful, RefreshToken received.");
    console.log(
      "RefreshToken 1 (First 20 chars):",
      refreshToken1.substring(0, 20) + "...",
    );

    console.log("\n--- 2. Call Refresh Endpoint ---");
    const refreshResponse = await client.post("/refresh", {
      refreshToken: refreshToken1,
    });
    console.log("Refresh Status:", refreshResponse.status);

    const refreshToken2 = refreshResponse.data.refreshToken;
    if (!refreshToken2) {
      console.error("❌ FAIL: No refreshToken returned in refresh response");
      return;
    }

    if (refreshToken1 === refreshToken2) {
      console.error("❌ FAIL: RefreshToken did not change (Rotation failed)");
    } else {
      console.log("✅ PASS: RefreshToken Rotated successfully.");
      console.log(
        "RefreshToken 2 (First 20 chars):",
        refreshToken2.substring(0, 20) + "...",
      );
    }

    // Check Access Token Cookie update (by checking if cookie exists/changed - tough to check exact value but we can see headers)
    // tough-cookie handles the cookie, we can inspect jar
    const cookies = await jar.getCookies("http://localhost:5000");
    const tokenCookie = cookies.find((c) => c.key === "token");
    if (tokenCookie) {
      console.log("✅ PASS: New Access Token Cookie present.");
    } else {
      console.error("❌ FAIL: No Access Token Cookie found after refresh.");
    }

    console.log("\n--- 3. Attempt Reuse of Old Refresh Token ---");
    try {
      await client.post("/refresh", { refreshToken: refreshToken1 });
      console.error(
        "❌ FAIL: Old RefreshToken verification SUCCEEDED (Should have failed)",
      );
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log("✅ PASS: Old RefreshToken rejected with 403 as expected.");
        if (
          error.response.data.message &&
          error.response.data.message.includes("Reused")
        ) {
          console.log("   (Reuse message confirmed)");
        }
      } else {
        console.error(
          "❌ FAIL: Unexpected error status during reuse attempt:",
          error.response ? error.response.status : error.message,
        );
        console.log(error.response.data);
      }
    }

    console.log("\n--- 4. Logout ---");
    const logoutResponse = await client.post("/logout");
    console.log("Logout Status:", logoutResponse.status);

    // After logout, try to use RefreshToken 2 (which should now be revoked becuase logout revokes ALL tokens)
    console.log("\n--- 5. Attempt Refresh after Logout ---");
    try {
      await client.post("/refresh", { refreshToken: refreshToken2 });
      console.error(
        "❌ FAIL: RefreshToken 2 worked after Logout (Should have failed)",
      );
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log("✅ PASS: RefreshToken 2 rejected after logout with 403.");
      } else {
        console.error(
          "❌ FAIL: Unexpected error status after logout:",
          error.response ? error.response.status : error.message,
        );
      }
    }
  } catch (error) {
    console.error(
      "❌ CRITICAL ERROR:",
      error.response ? error.response.data : error.message,
    );
  }
}

runTest();
