const axios = require("axios");

const apiKey = "rnd_XeGehKOJVwPzC0WCkju8yknahLF0"; // Updated valid key
const serviceId = "srv-d8e2mqs2m8qs738h8n00";

async function checkDeploy() {
  try {
    const res = await axios.get(`https://api.render.com/v1/services/${serviceId}/deploys?limit=5`, {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
    const deploys = res.data;
    console.log("=== LATEST DEPLOYS ===");
    deploys.forEach(d => {
      console.log(`ID: ${d.deploy.id} | Status: ${d.deploy.status} | Commit: ${d.deploy.commit?.id?.substring(0, 7)} | Msg: ${d.deploy.commit?.message?.trim()}`);
    });
    
    // Check if the latest is building/live/failed
    const latest = deploys[0]?.deploy;
    if (latest) {
      console.log(`\nLatest Deploy Status: ${latest.status}`);
    }
  } catch (e) {
    console.error("Error fetching Render deploys:", e.response?.data || e.message);
  }
}

checkDeploy();
