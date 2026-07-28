const axios = require("axios");

const RENDER_URL = "https://ecommerce-platform-305.onrender.com";

async function run() {
  try {
    const res = await axios.post(`${RENDER_URL}/api/auth/login`, {
      email: "buyer1@test.com",
      password: "Test@1234",
    }, { timeout: 45000 });
    console.log("Status:", res.status);
    console.log("Body:", JSON.stringify(res.data, null, 2));
  } catch(e) {
    console.error("HTTP Status:", e.response?.status);
    console.error("Response Body:", JSON.stringify(e.response?.data, null, 2));
  }
  process.exit(0);
}
run();
