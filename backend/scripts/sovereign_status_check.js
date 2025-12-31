const http = require('http');
const { AuditLog, sequelize } = require('../sequelize_setup');

console.log('=== SOVEREIGN STATUS CHECK ===');

async function check() {
    try {
        // 1. Check Audit Log for Launch Event
        const launchLog = await AuditLog.findOne({
            where: {
                action: 'SOVEREIGN_LAUNCH_INITIATED'
            },
            order: [['createdAt', 'DESC']]
        });

        if (launchLog) {
            console.log('✅ Audit Log: Launch Registered at ' + launchLog.createdAt);
        } else {
            console.log('⚠️ Audit Log: No Launch Event Found (Prep script failed?)');
        }

        // 2. Check Dashboard Reachability
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/dashboard/command',
            method: 'GET',
            timeout: 2000
        };

        const req = http.request(options, (res) => {
            console.log(`✅ Dashboard Reachable: Status ${res.statusCode}`);
            process.exit(0);
        });

        req.on('error', (e) => {
            console.log(`❌ Dashboard Unreachable: ${e.message}`);
            // Don't fail the script, just report
            process.exit(0);
        });

        req.end();

    } catch (error) {
        console.error('Check Error:', error);
        process.exit(1);
    }
}

check();
