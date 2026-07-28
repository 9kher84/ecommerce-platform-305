process.env.DATABASE_URL = "postgresql://neondb_owner:npg_hudwpP4y8bvU@ep-rapid-river-ap7l6xha-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require";
process.env.JWT_SECRET = "mysecurejwtsecret305";

const { sequelize, Request } = require("../sequelize_setup");
const jwt = require("jsonwebtoken");

const RENDER_API_KEY = "rnd_XeGehKOJVwPzC0WCkju8yknahLF0";
const SERVICE_ID = "srv-d8e2mqs2m8qs738h8n00";
const RENDER_URL = "https://ecommerce-platform-305.onrender.com";

async function verifyPayload() {
  console.log("==========================================");
  console.log("🧪 PAYLOAD VERIFICATION & GITHUB STATE");
  console.log("==========================================\n");

  // 1. GitHub vs Render state
  try {
    const deploysRes = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/deploys`, {
      headers: { Authorization: `Bearer ${RENDER_API_KEY}` }
    });
    const deploys = await deploysRes.json();
    const latestDeploy = deploys[0].deploy;
    console.log(`Render Live SHA: ${latestDeploy.commit.id}`);
  } catch(e) { console.log("Could not fetch Render API for commits."); }

  // 2. Test Payload
  console.log("\n--- Testing Single Payload ---");
  const token = jwt.sign({ id: "afd0aa5d-4930-4412-8ae8-9eb5b46a24e9", role: "buyer" }, process.env.JWT_SECRET, { expiresIn: '1h' });
  
  const payload = { 
    title: "Payload Verification Test", 
    description: "Ensuring payload works before Chaos", 
    quantity: 5,
    categoryId: 1,
    sectorId: 1
  };
  
  const response = await fetch(`${RENDER_URL}/api/requests`, {
    method: "POST", 
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify(payload)
  });
  
  const status = response.status;
  console.log(`HTTP Status: ${status}`);
  
  let json = {};
  try { json = await response.json(); } catch(e) {}
  console.log("Response Body:", json);

  if (status === 201 || status === 200) {
    console.log("\n--- Verifying in DB ---");
    await sequelize.authenticate();
    const dbCheck = await Request.findOne({ where: { title: "Payload Verification Test" }, order: [['createdAt', 'DESC']] });
    if (dbCheck) {
      console.log(`✅ SUCCESS! Request persisted in Neon DB with ID: ${dbCheck.id}`);
    } else {
      console.log("❌ FAILED! Request returned success but not found in DB.");
    }
  } else {
    console.log("❌ FAILED! Payload was rejected by the server.");
  }

  process.exit(0);
}

verifyPayload();
