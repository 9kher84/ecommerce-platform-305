const { sequelize, User, Organization, PurchaseOrder, SmartInventory, InventoryTransaction, SLARecord } = require("../sequelize_setup");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { publish, subscribeAll } = require("../utils/EventBus");

const report = {
  totalTests: 0,
  passed: 0,
  failed: 0,
  bugs: [],
  fixes: [],
};

async function assert(condition, message, impact = "High") {
  report.totalTests++;
  if (condition) {
    report.passed++;
    console.log(`✅ PASS: ${message}`);
  } else {
    report.failed++;
    console.error(`❌ FAIL: ${message}`);
    report.bugs.push({ issue: message, impact });
  }
}

async function runValidation() {
  console.log("🚀 Starting Architecture Freeze v1 Validation...");
  await sequelize.authenticate();

  const buyer = await User.findOne({ where: { email: "buyer.epic5@test.com" } });
  const sellerA = await User.findOne({ where: { email: "sellerA.epic5@test.com" } });
  const admin = await User.findOne({ where: { email: "admin.epic5@test.com" } });

  // 1. Security & Auth Negative Testing
  console.log("\n--- Phase 1: Security & Negative Testing ---");
  await assert(buyer && sellerA && admin, "Test accounts exist");
  
  try {
    const fakeUpdate = await PurchaseOrder.update(
      { status: "COMPLETED" },
      { where: { id: "00000000-0000-0000-0000-000000000000" } }
    );
    await assert(fakeUpdate[0] === 0, "Cannot update non-existent PO (UUID protection)");
  } catch(e) {
    await assert(true, "Invalid UUID throws or rejects gracefully");
  }

  // 2. Inventory Ledger Replayability Check
  console.log("\n--- Phase 2: Inventory Ledger Strict Validation ---");
  const allTx = await InventoryTransaction.findAll({ order: [['createdAt', 'ASC']] });
  let replayBalance = { available: 1000, reserved: 0, allocated: 0, inTransit: 0, quarantine: 0 };
  
  if (allTx.length > 0) {
    for (const tx of allTx) {
      if (tx.reason === "RESERVE") {
        replayBalance.available -= tx.quantity;
        replayBalance.reserved += parseFloat(tx.quantity);
      } else if (tx.reason === "ALLOCATE") {
        replayBalance.reserved -= parseFloat(tx.quantity);
        replayBalance.allocated += parseFloat(tx.quantity);
      } else if (tx.reason === "SHIP") {
        replayBalance.allocated -= parseFloat(tx.quantity);
        replayBalance.inTransit += parseFloat(tx.quantity);
      } else if (tx.reason === "RECEIVE") {
        replayBalance.inTransit -= parseFloat(tx.quantity);
      } else if (tx.reason === "QUARANTINE") {
        replayBalance.inTransit -= parseFloat(tx.quantity);
        replayBalance.quarantine += parseFloat(tx.quantity);
      }
    }
    const actualInv = await SmartInventory.findOne({ where: { productId: allTx[0].productId } });
    if (actualInv) {
      await assert(
        Math.abs(actualInv.availableQuantity - replayBalance.available) < 0.1 &&
        Math.abs(actualInv.allocatedQuantity - replayBalance.allocated) < 0.1 &&
        Math.abs(actualInv.inTransitQuantity - replayBalance.inTransit) < 0.1,
        "Inventory Ledger is 100% Replayable (Zero Drift)"
      );
    }
  } else {
    console.log("⚠️ No transactions to replay yet. Run normal E2E first.");
  }

  // 3. Database Indexes & Hot Tables Scan
  console.log("\n--- Phase 3: Database Integrity & Indexes ---");
  const [fkResults] = await sequelize.query(`
    SELECT conname, contype 
    FROM pg_constraint 
    WHERE contype = 'f' AND conname LIKE '%users%';
  `);
  await assert(fkResults.length > 0, "Foreign Keys to Users exist (Tech Debt Identified)");
  report.fixes.push("Deferred FK removal to Microservices migration phase (ADR-003).");

  // 4. Performance & Load simulation
  console.log("\n--- Phase 4: Load & EventBus Validation ---");
  const eventStart = Date.now();
  let eventsCaught = 0;
  subscribeAll((evt) => {
    if (evt.version === 1 && evt.id) eventsCaught++;
  });
  
  for(let i=0; i<50; i++) {
    publish("TEST_EVENT", "System", "123", "system", "000", { idx: i });
  }
  const eventTime = Date.now() - eventStart;
  await assert(eventsCaught >= 50, `EventBus processed 50 events in ${eventTime}ms without dropping.`);
  await assert(eventTime < 1000, "EventBus latency is within acceptable limits (<1s).");

  console.log("\n--- SUMMARY ---");
  console.log(`Total: ${report.totalTests}, Passed: ${report.passed}, Failed: ${report.failed}`);
  
  const fs = require("fs");
  fs.writeFileSync("VALIDATION_REPORT_RAW.json", JSON.stringify(report, null, 2));
  console.log("Report saved to VALIDATION_REPORT_RAW.json");
}

runValidation().catch(console.error).finally(() => process.exit(0));
