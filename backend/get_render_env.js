const axios = require("axios");

const apiKey = "rnd_XeGehKOJVwPzC0WCkju8yknahLF0";
const serviceId = "srv-d8e2mqs2m8qs738h8n00";

async function getEnvVars() {
  try {
    const res = await axios.get(`https://api.render.com/v1/services/${serviceId}/env-vars`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    console.log("=== ENV VARS ===");
    console.log(JSON.stringify(res.data.map(v => ({ key: v.envVar.key, value: v.envVar.value ? "[SET]" : "[EMPTY]" })), null, 2));
  } catch (e) {
    console.error("Error fetching env vars:", e.response?.data || e.message);
  }
}

getEnvVars();
