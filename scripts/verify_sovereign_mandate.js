const http = require('http');
const app = require('../backend/server');
const { sequelize } = require('../backend/sequelize_setup');

const OWNER_ID = process.env.OWNER_ID || '11111111-1111-1111-1111-111111111111';

// UTILS
function makeRequest(port, method, path, cookie, body) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: port,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };
        if (cookie) options.headers['Cookie'] = cookie;

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed = data;
                try { parsed = JSON.parse(data); } catch (e) { }
                resolve({ status: res.statusCode, body: parsed, headers: res.headers });
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function verifySovereignty() {
    console.log('👑 VERIFYING OWNER SOVEREIGNTY MANDATE...');
    let server;

    try {
        await sequelize.authenticate();
        await app.startServer(false);

        server = http.createServer(app);
        await new Promise(resolve => server.listen(0, resolve));
        const port = server.address().port;
        console.log(`✅ Server Up on ${port}`);

        // 1. OWNER BOOTSTRAP LOGIN
        console.log('\n🔒 1. Owner Authentication (Bootstrap)...');
        const resLogin = await makeRequest(port, 'POST', '/api/owner/bootstrap-login');
        if (resLogin.status !== 200) throw new Error(`Login Failed: ${resLogin.status}`);
        const cookie = resLogin.headers['set-cookie'][0].split(';')[0];
        console.log('✅ Bootstrap Login: Success (Cookie Received)');

        // 2. SOVEREIGN REQUEST VIEW (Feature 1 Supplement)
        console.log('\n👁️ 2. Sovereign Request View (/api/owner/requests)...');
        const resReqs = await makeRequest(port, 'GET', '/api/owner/requests?limit=5', cookie);
        if (resReqs.status !== 200) throw new Error(`Failed to list requests: ${resReqs.status}`);
        if (!Array.isArray(resReqs.body)) throw new Error('Response is not an array');
        console.log(`✅ Requests Retrieved: ${resReqs.body.length} items (Drafts, Published, etc.)`);

        // Log a few statuses found
        const statuses = resReqs.body.map(r => r.status);
        console.log(`   Statuses found: ${statuses.join(', ')}`);

        // 3. POLICY INTROSPECTION (Sovereign Check)
        console.log('\n🧠 3. Policy Introspection (Owner vs Request)...');
        // Pick a request ID
        const targetReq = resReqs.body[0];
        if (targetReq) {
            const policyPayload = {
                userId: OWNER_ID,
                resourceType: 'Request',
                resourceId: targetReq.id,
                action: 'cancel' // Severe action
            };
            const resPolicy = await makeRequest(port, 'POST', '/api/owner/policies/evaluate', cookie, policyPayload);
            if (resPolicy.body.allowed === true) {
                console.log('✅ Policy Introspection: ALLOWED (Owner can cancel any request)');
            } else {
                console.error('❌ Policy Introspection: DENIED (Sovereignty Violation)');
                throw new Error('Owner Sovereignty Check Failed');
            }
        } else {
            console.log('⚠️ Skipping Policy Check (No Requests found)');
        }

        // 4. DELEGATION (Verify Endpoint exists and works)
        console.log('\n🤝 4. Delegation Control...');
        // Just verify we can fetch delegations (assuming seed created one)
        const resDel = await makeRequest(port, 'GET', '/api/owner/delegations', cookie);
        if (resDel.status === 200) {
            console.log(`✅ Delegations Listed: ${resDel.body.length} items`);
        } else {
            throw new Error('Failed to list delegations');
        }

        console.log('\n🟢 SOVEREIGNTY VERIFIED. MANDATE EXECUTED.');
        server.close();
        process.exit(0);

    } catch (e) {
        console.error('❌ VERIFICATION FAILED:', e);
        if (server) server.close();
        process.exit(1);
    }
}

verifySovereignty();
