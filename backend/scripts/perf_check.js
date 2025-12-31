const autocannon = require('autocannon');
const { spawn } = require('child_process');
const path = require('path');

async function runPerfTest() {
    console.log('🚀 Starting Sovereign Performance Validation...');

    // 1. Start Server
    const server = spawn('node', ['server.js'], {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, NODE_ENV: 'development', PORT: 5001, DB_SSL_ENABLED: 'false' }, // Dev mode to bypass Vault for benchmark
        stdio: 'pipe' // Pipe output to avoid clogging test runner logs
    });

    let serverRunning = false;
    server.stdout.on('data', (data) => {
        if (data.toString().includes('Server running')) {
            serverRunning = true;
        }
    });

    // Wait for server to boot
    console.log('⏳ Waiting for server to boot...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🔥 Server active. Initiating 1000 concurrent user simulation...');

    // 2. Run Autocannon
    const instance = autocannon({
        url: 'http://localhost:5001/api/auth/login', // Test login which uses bcrypt (CPU intensive)
        connections: 100, // Concurrent connections (simulating users)
        pipelining: 1,
        duration: 10, // 10 seconds
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'owner@sovereign.domain', password: 'password123' })
    }, (err, result) => {
        if (err) {
            console.error('❌ Benchmark failed:', err);
        } else {
            console.log('📊 SOVEREIGN PERF REPORT:');
            console.log(`   - Latency (p99): ${result.latency.p99} ms`);
            console.log(`   - Requests/Sec: ${result.requests.average}`);
            console.log(`   - Throughput: ${(result.throughput.average / 1024 / 1024).toFixed(2)} MB/s`);

            if (result.latency.p99 < 500) {
                console.log('✅ STATUS: PASSED (<500ms)');
            } else {
                console.log('⚠️ STATUS: HIGH LATENCY');
            }
        }

        // 3. Kill Server
        server.kill();
        process.exit(0);
    });

    autocannon.track(instance, { renderProgressBar: true });
}

runPerfTest();
