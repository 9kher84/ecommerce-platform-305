const http = require('http');

console.log('=== SOVEREIGN FIX VERIFICATION RE-RUN ===');

function check(host) {
    return new Promise((resolve) => {
        const options = {
            hostname: host,
            port: 5000,
            path: '/api/dashboard/command',
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            timeout: 2000
        };

        const req = http.request(options, (res) => {
            console.log(`✅ [${host}] Status: ${res.statusCode}`);
            res.resume();
            resolve(true);
        });

        req.on('error', (e) => {
            console.error(`❌ [${host}] Failed: ${e.message}`);
            resolve(false);
        });

        req.end();
    });
}

async function run() {
    const localhost = await check('localhost');
    const ip = await check('127.0.0.1');

    if (localhost || ip) {
        console.log('✅ SERVER IS REACHABLE');
        process.exit(0);
    } else {
        console.log('❌ SERVER UNREACHABLE');
        process.exit(1);
    }
}

run();
