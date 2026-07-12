const { execSync } = require('child_process');
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const apiKey = process.env.RENDER_API_KEY;

async function runAudit() {
  console.log("=== FINAL AUDIT: RENDER DEPLOYMENT ===");
  
  // 1. Fetch Service Info (Branch)
  const svcResp = await fetch('https://api.render.com/v1/services/srv-d8e2mqs2m8qs738h8n00', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const svcData = await svcResp.json();
  const branch = svcData.branch;
  console.log(`Branch used by Render: ${branch}`);

  // 2. Fetch Latest Live Deploy
  const deploysResp = await fetch('https://api.render.com/v1/services/srv-d8e2mqs2m8qs738h8n00/deploys?limit=5', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const deploysData = await deploysResp.json();
  const liveDeploy = deploysData.find(d => d.deploy.status === 'live').deploy;
  
  console.log(`Deploy ID: ${liveDeploy.id}`);
  console.log(`Commit SHA: ${liveDeploy.commit.id}`);
  
  // 3. Show file content from git
  console.log(`\n=== FINAL AUDIT: FILE CONTENT IN COMMIT ${liveDeploy.commit.id} ===`);
  try {
    const gitShow = execSync(`git show ${liveDeploy.commit.id} -- backend/middleware/aiOutputSanitizer.js`, { encoding: 'utf8' });
    console.log(gitShow);
  } catch (e) {
    console.log("Git show failed:", e.message);
  }

  // 4. Final Login Test
  console.log("\n=== FINAL AUDIT: LOGIN TEST ===");
  const axios = require('axios');
  try {
    const loginRes = await axios.post('https://ecommerce-platform-305.onrender.com/api/auth/login', {
        email: 'test@test.com',
        password: 'password123'
    });
    console.log("Status Code:", loginRes.status);
    console.log("Raw Login Response:", JSON.stringify(loginRes.data, null, 2));
    
    const token = loginRes.data.token;
    if (token) {
        console.log(`First 30 chars of JWT: ${token.substring(0, 30)}...`);
        const containsRedacted = token.includes("[REDACTED_BY_SOVEREIGN_PROTOCOL]");
        console.log(`Contains [REDACTED_BY_SOVEREIGN_PROTOCOL]?: ${containsRedacted ? "Yes" : "No"}`);
    }
  } catch (e) {
    console.log("Login failed:", e.message);
  }
}

runAudit();
