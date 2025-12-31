const { sequelize } = require('../config/database');
const { AdminCredentialsBackup } = require('../models/HoneypotModels')(sequelize);
const sovereignKillSwitch = require('./kill-switch');

async function executeLiveFire() {
    console.log('🔴 STARTING LIVE FIRE EXERCISE: HONEYPOT ATTACK SIMULATION');
    console.log('===========================================================');

    // 0. Warmup (Simulate Running System)
    await sequelize.authenticate();
    await sequelize.query('SELECT 1');
    const { AuditLog } = require('../sequelize_setup');
    await AuditLog.findOne(); // Cache model internals
    console.log('✅ System Warmed Up. Commencing Attack...');

    // 1. Setup Measurement
    const start = process.hrtime();

    try {
        console.log('⚡ Attacker attempting to read [admin_credentials_backup]...');

        // We override the actual exit to measure time, otherwise the script dies instantly
        const originalExit = process.exit;
        let killSwitchTriggered = false;

        process.exit = (code) => {
            const end = process.hrtime(start);
            const durationMs = (end[0] * 1000) + (end[1] / 1e6);

            console.log(`🛑 KILL SWITCH ACTIVATED!`);
            console.log(`⏱️  Response Time: ${durationMs.toFixed(3)}ms`);

            if (durationMs < 100) {
                console.log('✅ SUCCESS: System reacted within sovereign timeframe (<100ms).');
            } else {
                console.log('❌ FAILURE: Reaction too slow.');
            }

            killSwitchTriggered = true;
            // Restore and exit
            process.exit = originalExit;
            process.exit(code);
        };

        // 2. Trigger
        // We must suppress logger specifically for this test to avoid noise? No, logs are good.
        // We mock isolateDatabase to speed up check? No, we want real latency.
        // But isolateDatabase is empty currently, so it's fast.

        await AdminCredentialsBackup.findOne();

    } catch (error) {
        console.error('Unexpected error during simulation:', error);
    }
}

executeLiveFire();
