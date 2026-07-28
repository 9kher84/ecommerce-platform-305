const axios = require("axios");

const apiKey = "rnd_XeGehKOJVwPzC0WCkju8yknahLF0";
const serviceId = "srv-d8e2mqs2m8qs738h8n00";
const deployId = "dep-d9d4gvj7uimc73fiill0";

async function poll() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await axios.get(`https://api.render.com/v1/services/${serviceId}/deploys/${deployId}`, {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      const d = res.data;
      console.log(`[${new Date().toLocaleTimeString()}] Status: ${d.status}`);
      if (d.status === "live" || d.status === "update_failed" || d.status === "failed") {
        process.exit(d.status === "live" ? 0 : 1);
      }
    } catch (e) {
      console.error("Error:", e.message);
    }
    await new Promise(r => setTimeout(r, 10000));
  }
  console.log("Polling timed out");
  process.exit(2);
}
poll();
