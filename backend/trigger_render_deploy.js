const axios = require("axios");

const apiKey = "rnd_XeGehKOJVwPzC0WCkju8yknahLF0";
const serviceId = "srv-d8e2mqs2m8qs738h8n00";

async function triggerDeploy() {
  try {
    const res = await axios.post(`https://api.render.com/v1/services/${serviceId}/deploys`, {}, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    console.log("=== DEPLOY TRIGGERED ===");
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error("Error triggering deploy:", e.response?.data || e.message);
  }
}

triggerDeploy();
