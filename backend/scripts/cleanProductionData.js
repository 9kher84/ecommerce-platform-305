const { sequelize } = require("../sequelize_setup");
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");

async function cleanProductionData() {
  console.log(
    `🧹 Starting Database Cleanup... ${isDryRun ? "[DRY RUN MODE]" : "[DANGER: REAL EXECUTION]"}`,
  );

  const tablesToClean = [
    "supervisor_commission_shares",
    "supervisor_assignments",
    "supervisor_notifications",
    "CommissionTransactions",
    "PaymentTransactions",
    "PaymentAuditLogs",
    "WithdrawalLogs",
    "AdminActionLogs",
    "EventLogs",
    "invoices",
    "Deals",
    "PurchaseRequests",
    "PriceQuotes",
    "AlternativeQuotes",
    "Notifications",
    "Reports",
    "Ratings",
    "BuyerLimits",
    "SellerInteractionEvents",
    "MarketSilenceEvents",
    "SellerDecisions",
    "BuyerDecisionContexts",
    "TrustScores",
    "Sanctions",
    "InventoryMetrics",
    "AutoReplenishmentOrders",
    "AuditLogs",
    "ActionLogs",
  ];

  try {
    await sequelize.authenticate();
    console.log("✅ Connected to database.");

    for (const table of tablesToClean) {
      try {
        if (isDryRun) {
          console.log(`[DRY RUN] Would delete all records from: ${table}`);
        } else {
          console.log(`[EXECUTE] Deleting all records from: ${table}...`);
          // Using TRUNCATE CASCADE to clear and reset identity/sequences where applicable
          await sequelize.query(`TRUNCATE TABLE "${table}" CASCADE;`);
        }
      } catch (err) {
        console.error(`⚠️ Could not clean table ${table}:`, err.message);
      }
    }

    // Clean users except owner and admin
    if (isDryRun) {
      console.log(`[DRY RUN] Would delete non-admin/owner users from: users`);
    } else {
      console.log(`[EXECUTE] Deleting non-admin/owner users...`);
      await sequelize.query(
        `DELETE FROM "users" WHERE "role" NOT IN ('owner', 'admin');`,
      );
    }

    console.log("🎉 Cleanup process finished.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Fatal error during cleanup:", error);
    process.exit(1);
  }
}

cleanProductionData();
