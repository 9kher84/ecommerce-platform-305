const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

console.log('🚬 Starting Smoke Test...');

// 1. Start Server
const serverProcess = spawn('node', ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, NODE_ENV: 'development', PORT: '5005' }, // Use 5005 to avoid conflicts
    stdio: 'pipe'
});

let serverReady = false;

serverProcess.stdout.on('data', (data) => {
    const log = data.toString();
    // console.log(`SERVER: ${log}`);
    if (log.includes('Server running on port 5005')) {
        serverReady = true;
        console.log('✅ Server Started on Port 5005');
        runTests();
    }
});

serverProcess.stderr.on('data', (data) => {
    console.error(`SERVER ERROR: ${data}`);
});

function makeRequest(path) {
    return new Promise((resolve, reject) => {
        http.get(`http://localhost:5005${path}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({ statusCode: res.statusCode, body: data });
            });
        }).on('error', reject);
    });
}

async function runTests() {
    try {
        // Test 1: Health
        console.log('🧪 Testing /api/health...');
        const health = await makeRequest('/api/health');
        if (health.statusCode === 200) {
            console.log('✅ Health Check Passed');
        } else {
            console.error('❌ Health Check Failed:', health.statusCode);
            process.exit(1);
        }

        // Test 2: Categories (Public)
        console.log('🧪 Testing /api/categories...');
        const cats = await makeRequest('/api/categories');
        if (cats.statusCode === 200) {
            const body = JSON.parse(cats.body);
            if (body.status === 'success') {
                console.log(`✅ Categories Fetched (Count: ${body.results})`);
            } else {
                console.error('❌ Categories Invalid Response');
            }
        } else {
            console.error('❌ Categories Failed:', cats.statusCode);
        }

        console.log('🏁 Smoke Test Completed Successfully.');
        serverProcess.kill();
        process.exit(0);

    } catch (err) {
        console.error('❌ Test Execution Failed:', err);
        serverProcess.kill();
        process.exit(1);
    }
}

// Timeout
setTimeout(() => {
    if (!serverReady) {
        console.error('❌ Timeout waiting for server.');
        serverProcess.kill();
        process.exit(1);
    }
}, 15000);
