const autocannon = require('autocannon');
const { spawn } = require('child_process');
const path = require('path');

async function runDrill() {
    console.log('🚨 STARTING "SUDDEN DEATH" DRILL...');

    // 1. Start Server
    const server = spawn('node', ['server.js'], {
        cwd: path.join(__dirname, '..'),
        env: { ...process.env, NODE_ENV: 'development', PORT: 5003, REDIS_URL: 'redis://localhost:6379' },
        stdio: 'pipe'
    });

    let serverRunning = false;
    server.stdout.on('data', (data) => {
        const msg = data.toString();
        // UNCOMMENT TO SEE SERVER LOGS
        // console.log('[SERVER]', msg.trim()); 

        if (msg.includes('Server running')) {
            if (!serverRunning) {
                serverRunning = true;
                console.log('🔥 Server Active. Launching Attack...');
                startAttack();
            }
        }
        if (msg.includes('Sovereign Clean Exit')) {
            console.log('✅ PROOF: Graceful Exit Confirmed in Logs.');
        }
    });

    server.stderr.on('data', (data) => {
        console.error('[SERVER ERROR]', data.toString());
    });

    // 2. Attack Logic
    function startAttack() {
        // Start autocannon
        const instance = autocannon({
            url: 'http://localhost:5002/api/health',
            connections: 100, // 100 concurrent users
            duration: 10,
        });

        console.log('⚔️  Flooding server with 100 concurrent requests...');

        // 3. Kill Switch (HTTP Trigger for reliability)
        setTimeout(() => {
            console.log('\n🛑 EXECUTING MANUAL SHUTDOWN TRIGGER (Drill Mode)!');
            const axios = require('axios');
            axios.post('http://localhost:5003/api/internal/shutdown-drill')
                .then(() => console.log('✅ Trigger sent.'))
                .catch(err => console.error('❌ Trigger failed:', err.message));
        }, 5000);
    }

    server.on('exit', (code) => {
        console.log(`💀 Server Process Died with code: ${code}`);
        if (code === 0) {
            console.log('🏆 STATUS: DRILL PASSED (Clean Exit 0)');
        } else {
            console.log('⚠️ STATUS: FAILED (Dirty Exit)');
        }
        process.exit(0);
    });
}

runDrill();
