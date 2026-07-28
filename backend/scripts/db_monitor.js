process.env.DATABASE_URL = "postgresql://neondb_owner:npg_hudwpP4y8bvU@ep-rapid-river-ap7l6xha-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require";

const { sequelize } = require("../sequelize_setup");
const fs = require("fs");

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function runMonitor() {
  console.log("==========================================");
  console.log("🔍 DATABASE LOCK MONITOR STARTED");
  console.log("==========================================\n");
  
  await sequelize.authenticate();
  let maxLocks = 0;
  let deadlocksDetected = 0;

  fs.writeFileSync('db_monitor_stats.json', JSON.stringify({ maxLocks, deadlocksDetected }));

  while(true) {
    try {
      const [locksRes] = await sequelize.query(`SELECT count(*) FROM pg_locks WHERE NOT granted;`);
      const waitingLocks = parseInt(locksRes[0].count);
      
      if (waitingLocks > maxLocks) {
        maxLocks = waitingLocks;
      }

      // Very rough check for deadlocks in postgres (usually resolved automatically, but we can check pg_stat_activity)
      const [activityRes] = await sequelize.query(`SELECT state, wait_event_type FROM pg_stat_activity WHERE wait_event_type = 'Lock'`);
      if (activityRes.length > 50) { // Just a heuristic for severe contention
         deadlocksDetected++;
      }

      fs.writeFileSync('db_monitor_stats.json', JSON.stringify({ maxLocks, deadlocksDetected }));
      process.stdout.write(`\rMax Locks: ${maxLocks} | High Contention Spikes: ${deadlocksDetected}`);
      
    } catch(e) {
      // DB connection might drop during restart
      process.stdout.write(`\rDB Connection lost, retrying...`);
    }
    await sleep(1000);
  }
}

runMonitor();
