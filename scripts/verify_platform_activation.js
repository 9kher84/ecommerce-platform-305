const http = require('http');
const app = require('../backend/server');
const { sequelize, User, PurchaseRequest } = require('../backend/sequelize_setup');

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

async function verifyActivation() {
    console.log('🚀 ACTIVATING PLATFORM: FINAL VERIFICATION...');
    let server;

    try {
        await sequelize.authenticate();
        await app.startServer(false);

        server = http.createServer(app);
        await new Promise(resolve => server.listen(0, resolve));
        const port = server.address().port;
        console.log(`✅ Server Up on ${port}`);

        // 1. BOOTSTRAP OWNER
        const resLogin = await makeRequest(port, 'POST', '/api/owner/bootstrap-login');
        if (resLogin.status !== 200) throw new Error('Bootstrap Login Failed');
        const cookie = resLogin.headers['set-cookie'][0].split(';')[0];
        console.log('✅ Owner Login: SUCCESS');

        // 2. VERIFY POLICY INTROSPECTION (Mandate Part 2)
        console.log('\n🔍 Verifying Policy Introspection...');
        // Need a user and a resource
        const buyer = await User.findOne({ where: { role: 'buyer' } });
        // Create or Find a Request (Published) logic
        let request = await PurchaseRequest.findOne({ where: { status: 'published' } });
        if (!request) {
            // Create one if needed
            request = await PurchaseRequest.create({
                title: 'Policy Test Request',
                userId: buyer.id,
                categoryId: '11111111-1111-1111-1111-111111111111',
                status: 'published',
                expiresAt: new Date(Date.now() + 1000000)
            });
        }

        // Evaluate "viewPublished" on REAL context
        const policyPayload = {
            userId: buyer.id,
            resourceType: 'Request',
            action: 'viewPublished',
            resourceId: request.id
        };

        const resPolicy = await makeRequest(port, 'POST', '/api/owner/policies/evaluate', cookie, policyPayload);
        if (resPolicy.status === 200 && resPolicy.body.allowed === true) {
            console.log('✅ Policy Evaluation (viewPublished): PASSED (Allowed)');
        } else {
            console.error('❌ Policy Evaluation Failed:', resPolicy.body);
            throw new Error('Policy Engine Check Failed');
        }

        // 3. VERIFY DELEGATION CONTROL
        console.log('\n🤝 Verifying Delegation Control...');
        const techAdmin = await User.findOne({ where: { role: 'admin' } }); // or create one
        if (techAdmin) {
            const delPayload = {
                fromUserId: OWNER_ID,
                toUserId: techAdmin.id,
                type: 'GENERAL',
                scopeType: 'global',
                expiresAt: new Date(Date.now() + 86400000)
            };
            const resDel = await makeRequest(port, 'POST', '/api/owner/delegations', cookie, delPayload);
            if (resDel.status === 201) {
                console.log('✅ Delegation Created: SUCCESS');
            } else {
                console.error('Delegation Error:', resDel.body);
                throw new Error('Delegation Creation Failed');
            }
        } else {
            console.log('⚠️ Skipping Delegation check (No Admin user found)');
        }

        console.log('\n🟢 SYSTEM ACTIVATION VERIFIED. PLATFORM IS LIVE & SOVEREIGN.');
        server.close();
        process.exit(0);

    } catch (e) {
        console.error('❌ ACTIVATION FAILED:', e);
        if (server) server.close();
        process.exit(1);
    }
}

verifyActivation();
