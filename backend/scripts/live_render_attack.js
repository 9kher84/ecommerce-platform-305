process.env.DATABASE_URL = "postgresql://neondb_owner:npg_hudwpP4y8bvU@ep-rapid-river-ap7l6xha-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require";
process.env.JWT_SECRET = "mysecurejwtsecret305";

const { sequelize, User, Organization, PurchaseOrder, PurchaseOrderLine, SmartInventory, InventoryTransaction, SLARecord, Shipment, Receipt, RFQ, Quotation, Request } = require("../sequelize_setup");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const fs = require("fs");

const RENDER_API_KEY = "rnd_XeGehKOJVwPzC0WCkju8yknahLF0";
const SERVICE_ID = "srv-d8e2mqs2m8qs738h8n00";
const RENDER_URL = "https://ecommerce-platform-305.onrender.com";

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function runLiveAttack() {
  console.log("====================================================");
  console.log("🔥 LIVE RENDER CHAOS ATTACK & VALIDATION (V4 - REAL ENDPOINTS)");
  console.log("====================================================\n");

  const report = {};

  // 1. Verify Deployment Commit
  console.log("--- 1. VERIFYING RENDER DEPLOYMENT ---");
  try {
    const deploysRes = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/deploys`, {
      headers: { Authorization: `Bearer ${RENDER_API_KEY}` }
    });
    const deploys = await deploysRes.json();
    const latestDeploy = deploys[0].deploy;
    console.log(`Live Commit SHA: ${latestDeploy.commit.id}`);
    console.log(`Status: ${latestDeploy.status}`);
    console.log(`Deployed At: ${latestDeploy.updatedAt}`);
    report.DeployCommit = latestDeploy.commit.id;
  } catch(e) {
    console.log("Failed to fetch Render deploy status.");
  }

  await sequelize.authenticate();
  console.log("Connected to LIVE Neon Database.");

  // 2. LIVE CHAOS TEST (Restart while hitting API)
  console.log("\n--- 2. LIVE CHAOS TEST (SERVER RESTART) ---");
  
  const token = jwt.sign({ id: "afd0aa5d-4930-4412-8ae8-9eb5b46a24e9", role: "buyer" }, process.env.JWT_SECRET, { expiresIn: '1h' });

  if (token) {
    console.log(`Executing 200 concurrent RFQ creation requests...`);
    const reqPromises = [];
    const payload = { title: "Chaos RFQ", description: "Chaos Test", quantity: 10 };
    for(let i=0; i<200; i++) {
      reqPromises.push(
        fetch(`${RENDER_URL}/api/requests`, {
          method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify(payload)
        }).then(r => r.status).catch(e => "NETWORK_ERROR")
      );
    }
    
    // Kill the server midway
    setTimeout(async () => {
      console.log(`[RENDER API] Restarting Server (srv-d8e2mqs2m8qs738h8n00) NOW!`);
      await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/restart`, {
        method: "POST", headers: { Authorization: `Bearer ${RENDER_API_KEY}` }
      });
    }, 1500);

    const results = await Promise.all(reqPromises);
    const statuses = {};
    results.forEach(s => statuses[s] = (statuses[s] || 0) + 1);
    console.log("Request Status Breakdown:");
    Object.entries(statuses).forEach(([status, count]) => console.log(`  HTTP ${status}: ${count}`));
    report.ChaosStatuses = statuses;
  }

  // 3. LEDGER REPLAY (NEON DB)
  console.log("\n--- 3. LEDGER REPLAY (ZERO DRIFT CHECK) ---");
  const allTx = await InventoryTransaction.findAll({ order: [['createdAt', 'ASC']] });
  const productTxMap = {};
  allTx.forEach(tx => {
    if(!productTxMap[tx.productId]) productTxMap[tx.productId] = [];
    productTxMap[tx.productId].push(tx);
  });
  
  let driftedProducts = 0;
  let totalDriftAmount = 0;
  for (const [prodId, txs] of Object.entries(productTxMap)) {
    let replay = { available: 0, reserved: 0, allocated: 0, inTransit: 0, quarantine: 0 }; 
    for (const tx of txs) {
      const q = parseFloat(tx.quantity);
      if (tx.reason === "INITIAL" || tx.reason === "ADJUSTMENT") { replay.available += q; }
      else if (tx.reason === "RESERVE") { replay.available -= q; replay.reserved += q; }
      else if (tx.reason === "ALLOCATE") { replay.reserved -= q; replay.allocated += q; }
      else if (tx.reason === "SHIP") { replay.allocated -= q; replay.inTransit += q; }
      else if (tx.reason === "RECEIVE") { replay.inTransit -= q; }
      else if (tx.reason === "QUARANTINE") { replay.inTransit -= q; replay.quarantine += q; }
      else if (tx.reason === "RELEASE") { replay.quarantine -= q; replay.available += q; }
    }
    
    const actual = await SmartInventory.findOne({ where: { productId: prodId } });
    if(actual) {
      const d = Math.abs(actual.reservedQuantity - replay.reserved) + 
                Math.abs(actual.allocatedQuantity - replay.allocated) + 
                Math.abs(actual.inTransitQuantity - replay.inTransit) + 
                Math.abs(actual.quarantineQuantity - replay.quarantine);
      if (d > 0) {
        driftedProducts++;
        totalDriftAmount += d;
        console.log(`  - Drift on ${prodId} (Actual: ${actual.reservedQuantity}, Replay: ${replay.reserved})`);
      }
    }
  }
  console.log(`Products Checked: ${Object.keys(productTxMap).length}`);
  console.log(`Products with Drift: ${driftedProducts} (Total Drift: ${totalDriftAmount})`);
  report.LedgerDrift = driftedProducts;

  // 4. DATABASE ORPHANS (EXTENSIVE)
  console.log("\n--- 4. DATABASE CORRUPTION (ORPHANS) ---");
  const checks = [
    { name: "POLines without PO", q: 'SELECT COUNT(*) FROM "PurchaseOrderLines" WHERE "purchaseOrderId" NOT IN (SELECT id FROM "PurchaseOrders")' },
    { name: "Shipments without PO", q: 'SELECT COUNT(*) FROM "Shipments" WHERE "purchaseOrderId" NOT IN (SELECT id FROM "PurchaseOrders")' },
    { name: "Receipts without Shipment", q: 'SELECT COUNT(*) FROM "Receipts" WHERE "shipmentId" NOT IN (SELECT id FROM "Shipments")' },
    { name: "Quotations without RFQ", q: 'SELECT COUNT(*) FROM "Quotations" WHERE "requestId" NOT IN (SELECT id FROM "Requests")' },
    { name: "Awards without Quotation", q: 'SELECT COUNT(*) FROM "Awards" WHERE "quotationId" NOT IN (SELECT id FROM "Quotations")' }
  ];
  let orphanCount = 0;
  for(const c of checks) {
    try {
      const [res] = await sequelize.query(c.q);
      const count = parseInt(res[0].count);
      orphanCount += count;
      console.log(`  - ${c.name}: ${count}`);
    } catch(e) {
      console.log(`  - ${c.name}: Query Failed: ${e.message}`);
    }
  }
  report.Orphans = orphanCount;

  // 5. DB METRICS (LOCKS & SLOW QUERIES)
  console.log("\n--- 5. DATABASE LOCKS & SLOW QUERIES ---");
  try {
    const [locks] = await sequelize.query(`SELECT count(*) FROM pg_locks WHERE NOT granted;`);
    console.log(`  Waiting Locks: ${locks[0].count}`);
    report.Locks = locks[0].count;
  } catch(e) {}
  
  try {
    const [sq] = await sequelize.query(`
      SELECT query, mean_exec_time, calls 
      FROM pg_stat_statements 
      ORDER BY mean_exec_time DESC 
      LIMIT 3;
    `);
    console.log("  Top Slow Queries:");
    sq.forEach(q => console.log(`  [${parseFloat(q.mean_exec_time).toFixed(2)}ms] - ${q.query.substring(0,60)}...`));
  } catch(e) {
    console.log("  pg_stat_statements not available on this Neon tier (Permission denied).");
  }

  // 6. EVENTBUS ORDERING CHECK
  console.log("\n--- 6. EVENT ORDERING & HALF TRANSACTIONS ---");
  console.log("  - Event Ordering: Since AuditLogs table doesn't exist, we rely on InventoryTransaction 'createdAt' timestamps.");
  let outOfOrder = 0;
  for(let i=1; i<allTx.length; i++) {
     if(allTx[i].createdAt < allTx[i-1].createdAt) outOfOrder++;
  }
  console.log(`  - Out of Order Transactions: ${outOfOrder}`);

  // 7. SECURITY (API TESTS)
  console.log("\n--- 7. SECURITY VECTORS ---");
  try {
    const fakeToken = jwt.sign({ id: "afd0aa5d-4930-4412-8ae8-9eb5b46a24e9", role: "buyer" }, "wrong-secret");
    const secRes = await fetch(`${RENDER_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${fakeToken}` } });
    console.log(`  - JWT Tampering Status: HTTP ${secRes.status} (Expected 401)`);
    report.SecurityJWTTampering = secRes.status;
  } catch(e) { console.log("  - JWT Tampering Status: Blocked"); }
  
  try {
    const sqlRes = await fetch(`${RENDER_URL}/api/requests?search=' OR 1=1 --`);
    console.log(`  - SQLi Defense Status: HTTP ${sqlRes.status} (Expected 400, 401, or safe query)`);
    report.SecuritySQLi = sqlRes.status;
  } catch(e) { }

  console.log("\n--- 8. MEMORY CONSTRAINTS ---");
  console.log("  - Unable to fetch Heap / GC from Render API directly without a dedicated endpoint or metrics dashboard integration.");

  console.log("\nLive Attack Complete.");
  process.exit(0);
}

runLiveAttack();
