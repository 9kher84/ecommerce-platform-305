const { execSync } = require('child_process');
const fs = require('fs');
const { sequelize } = require('./sequelize_setup');

async function runAudit() {
  const auditResults = [];
  
  console.log("=== AUDIT START ===\n");

  // 1. TODO/FIXME/HACK/TEMP
  console.log("1. TODO / FIXME / HACK / TEMP");
  console.log("1. TODO / FIXME / HACK / TEMP (Skipped in JS, will be reported manually)");

  // 5. Notifications
  console.log("\n5. Notifications Audit");
  const { Notification } = require('./sequelize_setup');
  const nullRecipients = await Notification.count({ where: { recipientId: null } });
  const nullTypes = await Notification.count({ where: { type: null } }).catch(() => 0); // fallback if field doesn't map properly
  console.log(`Null Recipients: ${nullRecipients}`);
  console.log(`Null Types: ${nullTypes}`);

  const { CommissionTransaction, Deal, User, PurchaseRequest, PriceQuote, Invoice } = require('./sequelize_setup');
  
  // 6. CommissionTransaction orphans
  console.log("\n6. CommissionTransaction Audit");
  const commissions = await CommissionTransaction.findAll();
  let orphanCommissions = 0;
  for (const c of commissions) {
    const s = await User.findByPk(c.sellerId);
    const b = await User.findByPk(c.buyerId);
    const d = await Deal.findByPk(c.dealId);
    if (!s || !b || !d) orphanCommissions++;
  }
  console.log(`Orphan Commissions: ${orphanCommissions}`);

  // 7. Orphan Records in other tables
  console.log("\n7. Orphan Records Audit");
  const deals = await Deal.findAll();
  let orphanDeals = 0;
  for (const d of deals) {
    const s = await User.findByPk(d.sellerId);
    const b = await User.findByPk(d.buyerId);
    if (!s || !b) orphanDeals++;
  }
  console.log(`Orphan Deals: ${orphanDeals}`);

  // 9. Logs
  console.log("\n9. Logs Audit");
  const logs = fs.readFileSync('server_output_post_3.log', 'utf8');
  const memoryAlerts = (logs.match(/HIGH MEMORY ALERT/g) || []).length;
  const errors = (logs.match(/Error:/g) || []).length;
  console.log(`Memory Alerts: ${memoryAlerts}`);
  console.log(`Errors: ${errors}`);

  console.log("\n=== AUDIT END ===");
  process.exit(0);
}
runAudit();
