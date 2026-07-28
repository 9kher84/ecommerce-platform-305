const axios = require("axios");

const apiKey = "rnd_XeGehKOJVwPzC0WCkju8yknahLF0";
const serviceId = "srv-d8e2mqs2m8qs738h8n00";

async function getService() {
  try {
    const res = await axios.get(`https://api.render.com/v1/services/${serviceId}`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    console.log("=== SERVICE DETAILS ===");
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error("Error fetching service details:", e.response?.data || e.message);
  }
}

getService();
