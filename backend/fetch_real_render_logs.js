const axios = require("axios");

const apiKey = "rnd_XeGehKOJVwPzC0WCkju8yknahLF0";
const ownerId = "tea-d8cncl68bjmc73c8qef0";
const resource = "srv-d8e2mqs2m8qs738h8n00";

async function fetchLogs() {
  try {
    const res = await axios.get("https://api.render.com/v1/logs", {
      headers: { Authorization: `Bearer ${apiKey}` },
      params: {
        ownerId: ownerId,
        resource: resource,
        limit: 20
      }
    });
    console.log("=== RENDER LOGS DATA ===");
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error("Error fetching logs:", e.response?.data || e.message);
  }
}

fetchLogs();
