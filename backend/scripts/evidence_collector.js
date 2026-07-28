const { sequelize, User, Organization, PurchaseOrder, SmartInventory, InventoryTransaction, SLARecord } = require("../sequelize_setup");
const crypto = require("crypto");
const { publish, subscribeAll, subscribe } = require("../utils/EventBus");

async function runEvidenceCollection() {
  console.log("=============================================");
  console.log("🚀 ARCHITECTURE FREEZE v1: EVIDENCE COLLECTOR");
  console.log("=============================================\n");

  await sequelize.authenticate();

  // ---------------------------------------------------------
  // 1. EVENTBUS STRESS TEST
  // ---------------------------------------------------------
  console.log("--- 1. EVENTBUS STRESS TEST ---");
  let receivedCount = 0;
  const targetEvents = 5000;
  subscribe("STRESS_TEST", (e) => { if (e.payload.isTest) receivedCount++; });
  
  const startBus = performance.now();
  for (let i = 0; i < targetEvents; i++) {
    publish("STRESS_TEST", "Test", "123", "system", "000", { isTest: true, seq: i });
  }
  const endBus = performance.now();
  
  console.log(`Published: ${targetEvents}`);
  console.log(`Received:  ${receivedCount}`);
  console.log(`Lost:      ${targetEvents - receivedCount}`);
  console.log(`Time:      ${(endBus - startBus).toFixed(2)} ms`);
  console.log(`Avg/Event: ${((endBus - startBus) / targetEvents).toFixed(4)} ms`);
  console.log(receivedCount === targetEvents ? "✅ EventBus PASS" : "❌ EventBus FAIL");
  console.log("");

  // ---------------------------------------------------------
  // 2. INVENTORY LEDGER REPLAYABILITY
  // ---------------------------------------------------------
  console.log("--- 2. INVENTORY LEDGER REPLAY PROOF ---");
  const allTx = await InventoryTransaction.findAll({ order: [['createdAt', 'ASC']] });
  if (allTx.length > 0) {
    const targetProduct = allTx[0].productId;
    const txForProduct = allTx.filter(t => t.productId === targetProduct);
    
    let replay = { available: 1000, reserved: 0, allocated: 0, inTransit: 0, quarantine: 0 };
    
    for (const tx of txForProduct) {
      const q = parseFloat(tx.quantity);
      if (tx.reason === "RESERVE") { replay.available -= q; replay.reserved += q; }
      else if (tx.reason === "ALLOCATE") { replay.reserved -= q; replay.allocated += q; }
      else if (tx.reason === "SHIP") { replay.allocated -= q; replay.inTransit += q; }
      else if (tx.reason === "RECEIVE") { replay.inTransit -= q; }
      else if (tx.reason === "QUARANTINE") { replay.inTransit -= q; replay.quarantine += q; }
    }
    
    const actual = await SmartInventory.findOne({ where: { productId: targetProduct } });
    console.log(`[Target Product]: ${targetProduct}`);
    console.log(`[Replayed State]: Avail=${replay.available}, Res=${replay.reserved}, Alloc=${replay.allocated}, InTrans=${replay.inTransit}, Quar=${replay.quarantine}`);
    console.log(`[Actual DB State]: Avail=${actual.availableQuantity}, Res=${actual.reservedQuantity}, Alloc=${actual.allocatedQuantity}, InTrans=${actual.inTransitQuantity}, Quar=${actual.quarantineQuantity}`);
    
    const drift = Math.abs(actual.availableQuantity - replay.available) + Math.abs(actual.allocatedQuantity - replay.allocated);
    console.log(`[Calculated Drift]: ${drift}`);
    console.log(drift === 0 ? "✅ Ledger Replay PASS" : "❌ Ledger Replay FAIL");
  } else {
    console.log("⚠️ No transactions to replay. Skipping.");
  }
  console.log("");

  // ---------------------------------------------------------
  // 3. RACE CONDITION SIMULATION
  // ---------------------------------------------------------
  console.log("--- 3. RACE CONDITION SIMULATION (INVENTORY) ---");
  // We simulate 20 concurrent RESERVE operations on a test inventory item to see if Postgres transactions handle it without negative balances.
  try {
    const InventoryService = require("../services/inventory/InventoryService");
    const testProductId = "test-prod-123";
    const testOrgId = "test-org-123";
    
    // Seed test inventory
    await SmartInventory.destroy({ where: { productId: testProductId } });
    await InventoryTransaction.destroy({ where: { productId: testProductId } });
    
    console.log("Executing 20 concurrent RESERVE operations of qty 10...");
    const promises = [];
    for(let i=0; i<20; i++) {
      promises.push(InventoryService.applyTransaction(testProductId, testOrgId, "NONE", "RESERVE", 10, "SimulatedPO", `po-${i}`));
    }
    await Promise.all(promises);
    
    const finalInv = await SmartInventory.findOne({ where: { productId: testProductId } });
    console.log(`Final Available: ${finalInv.availableQuantity}`);
    console.log(`Final Reserved:  ${finalInv.reservedQuantity}`);
    console.log(finalInv.availableQuantity === 800 && finalInv.reservedQuantity === 200 ? "✅ Race Condition PASS (Locks worked)" : "❌ Race Condition FAIL");
  } catch(e) {
    console.log("❌ Race Condition Error: " + e.message);
  }
  console.log("");

  // ---------------------------------------------------------
  // 4. DATABASE HEALTH (ORPHANS & INDEXES)
  // ---------------------------------------------------------
  console.log("--- 4. DATABASE HEALTH CHECK ---");
  const [missingIdx] = await sequelize.query(`
    SELECT relname AS table_name, seq_scan, idx_scan
    FROM pg_stat_user_tables
    WHERE seq_scan > 0 AND idx_scan = 0
    LIMIT 5;
  `);
  console.log("Tables with sequential scans and no index scans:");
  console.dir(missingIdx);
  
  const [orphans] = await sequelize.query(`
    SELECT COUNT(*) FROM "PurchaseOrderLines" 
    WHERE "purchaseOrderId" NOT IN (SELECT id FROM "PurchaseOrders");
  `);
  console.log(`Orphan PO Lines: ${orphans[0].count}`);
  console.log(parseInt(orphans[0].count) === 0 ? "✅ Orphans PASS" : "❌ Orphans FAIL");
  
  console.log("\nEvidence Collection Complete.");
  process.exit(0);
}

runEvidenceCollection().catch(e => { console.error(e); process.exit(1); });
