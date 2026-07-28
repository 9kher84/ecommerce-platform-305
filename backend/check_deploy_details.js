const axios = require("axios");

const apiKey = "rnd_XeGehKOJVwPzC0WCkju8yknahLF0";
const serviceId = "srv-d8e2mqs2m8qs738h8n00";
const deployId = "dep-d9d47bernols73cr5bbg";

async function getDeployDetails() {
  try {
    const res = await axios.get(`https://api.render.com/v1/services/${serviceId}/deploys/${deployId}`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    console.log("=== DEPLOY DETAILS ===");
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error("Error fetching deploy details:", e.response?.data || e.message);
  }
}

getDeployDetails();
