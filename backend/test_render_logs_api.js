const axios = require("axios");

const apiKey = "rnd_XeGehKOJVwPzC0WCkju8yknahLF0";
const serviceId = "srv-d8e2mqs2m8qs738h8n00";
const deployId = "dep-d9d47bernols73cr5bbg";

async function getLogs() {
  const endpoints = [
    `https://api.render.com/v1/services/${serviceId}/deploys/${deployId}/logs`,
    `https://api.render.com/v1/services/${serviceId}/logs`,
  ];
  for (const url of endpoints) {
    try {
      console.log("Testing URL:", url);
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      console.log("SUCCESS:", JSON.stringify(res.data, null, 2).substring(0, 1000));
      return;
    } catch(e) {
      console.log("FAILED:", e.response?.status, e.response?.data || e.message);
    }
  }
}

getLogs();
