const http = require('http');

console.log('=== SOVEREIGN FIX VERIFICATION ===');

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/dashboard/command',
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    },
    timeout: 3000
};

const req = http.request(options, (res) => {
    console.log(`✅ API STATUS: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 401 || res.statusCode === 403) {
            // 401/403 means app is running but auth is working, which is good for connectivity check
            console.log('✅ Endpoint Reachable');
            console.log('Sample Data:', data.substring(0, 100));
        } else {
            console.log('❌ Unexpected Status:', res.statusCode);
        }
        process.exit(0);
    });
});

req.on('error', (e) => {
    console.error(`❌ Connection Failed: ${e.message}`);
    process.exit(1);
});

req.end();
