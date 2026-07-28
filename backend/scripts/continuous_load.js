process.env.DATABASE_URL = "postgresql://neondb_owner:npg_hudwpP4y8bvU@ep-rapid-river-ap7l6xha-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require";
process.env.JWT_SECRET = "mysecurejwtsecret305";

const { sequelize, User } = require("../sequelize_setup");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const RENDER_URL = "https://ecommerce-platform-305.onrender.com";

const payload = { 
  title: "Chaos Request Load", 
  description: "Load testing during Render restart", 
  quantity: 5,
  categoryId: 1,
  sectorId: 1
};

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function setupAndRun() {
  await sequelize.authenticate();
  console.log("Connected to DB. Creating 2000 users (6000 requests capacity)...");
  
  const tokens = [];
  
  // Bulk create 2000 users
  const usersToCreate = [];
  for(let i = 0; i < 2000; i++) {
    const fakeId = require('crypto').randomUUID();
    usersToCreate.push({
      id: fakeId,
      name: `Load User ${i}`,
      email: `loaduser${i}_${Date.now()}@test.com`,
      password: 'password123',
      role: 'buyer',
      subscriptionTier: 'free',
      isActive: true
    });
    const token = jwt.sign({ id: fakeId, role: "buyer" }, process.env.JWT_SECRET, { expiresIn: '1h' });
    tokens.push(token);
    tokens.push(token);
    tokens.push(token);
  }
  
  await User.bulkCreate(usersToCreate, { ignoreDuplicates: true });
  
  console.log(`Created 2000 users. Total available requests: ${tokens.length}`);
  
  console.log("==========================================");
  console.log("🔥 CONTINUOUS LOAD STARTED");
  console.log("==========================================\n");
  
  let sent = 0;
  let success = 0;
  let failed = 0;

  fs.writeFileSync('chaos_stats.json', JSON.stringify({ expected: 0, persisted: 0 }));

  // Fire requests using tokens
  const batchSize = 10;
  for(let i=0; i<tokens.length; i+=batchSize) {
    const promises = [];
    for(let j=0; j<batchSize && i+j < tokens.length; j++) {
      sent++;
      fs.writeFileSync('chaos_stats.json', JSON.stringify({ expected: sent, persisted: success }));
      promises.push(
        fetch(`${RENDER_URL}/api/requests`, {
          method: "POST", 
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tokens[i+j]}` },
          body: JSON.stringify(payload)
        }).then(r => {
          if(r.status === 201 || r.status === 200) success++;
          else failed++;
        }).catch(e => failed++)
      );
    }
    await Promise.all(promises);
    process.stdout.write(`\rSent: ${sent} | Success: ${success} | Failed: ${failed} (Waiting for Restart...)`);
    await sleep(200); // Delay slightly
  }
  console.log("\nFinished dispatching all 6000 requests.");
}

setupAndRun();
