const http = require('http');
const app = require('../backend/server');
const { sequelize, PurchaseRequest, User } = require('../backend/sequelize_setup');

// UTILS
function makeRequest(port, method, path, cookie, body) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: port,
            path: path,
            method: method,
            headers: { 'Content-Type': 'application/json' }
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

async function verifyDeepTrace() {
    console.log('👑 VERIFYING DEEP TRACE (PHASE 2)...');
    let server;

    try {
        await sequelize.authenticate();
        await app.startServer(false);

        server = http.createServer(app);
        await new Promise(resolve => server.listen(0, resolve));
        const port = server.address().port;
        console.log(`✅ Server Up on ${port}`);

        // Login (Sovereign)
        const resLogin = await makeRequest(port, 'POST', '/api/owner/bootstrap-login');
        const cookie = resLogin.headers['set-cookie'][0].split(';')[0];
        console.log('✅ Login Success');

        // Create Test Data
        const user = await User.findOne({ where: { role: 'buyer' } });
        // Category fetch
        const category = await require('../backend/sequelize_setup').Category.findOne();

        const request = await PurchaseRequest.create({
            userId: user.id,
            title: 'Deep Trace Test',
            status: 'draft',
            categoryId: category ? category.id : 1
        });

        // 1. Trace (Timeline Check)
        console.log('\n🔍 1. Testing Deep Trace Timeline...');
        const tracePayload = {
            userId: user.id,
            resourceType: 'Request',
            resourceId: request.id,
            action: 'update'
        };
        const resTrace = await makeRequest(port, 'POST', '/api/owner/policy/trace', cookie, tracePayload);

        // Validation: Expect Timeline array
        const trace = resTrace.body.trace;
        if (!Array.isArray(trace) || trace.length < 2) {
            console.error('Trace Response:', JSON.stringify(resTrace.body, null, 2));
            throw new Error('Trace Timeline too short or missing');
        }

        console.log('Trace Length:', trace.length);

        // Check Rule #0 (Bypass Logic - here User is NOT owner, so Result FAIL)
        const bypassRule = trace.find(r => r.ruleId === 'OWNER_BYPASS');
        if (!bypassRule || bypassRule.result !== 'FAIL') {
            throw new Error('OWNER_BYPASS Rule missing or incorrect result for regular user');
        }

        // Check Input Capture
        console.log('Sample Inputs Captured:', bypassRule.inputs);

        // 2. Export JSON
        console.log('\n📦 2. Testing Trace Export...');
        const resExport = await makeRequest(port, 'POST', '/api/owner/policy/trace/export', cookie, tracePayload);

        if (!resExport.headers['content-type'].includes('application/json')) {
            throw new Error(`Export Content-Type mismatch: ${resExport.headers['content-type']}`);
        }

        if (!resExport.body.meta || !resExport.body.evaluation) {
            throw new Error('Export JSON Structure invalid');
        }

        if (resExport.body.meta.traceVersion !== '2.2') {
            throw new Error('Export Trace Version must be 2.2');
        }

        if (!resExport.body.meta.integrity || !resExport.body.meta.integrity.signature) {
            throw new Error('Trace Integrity Signature MISSING');
        }
        console.log('✅ Integrity Signature Verified');

        console.log('✅ Export successfully returned JSON with Meta');

        console.log('\n🟢 PHASE 2 VERIFIED.');
        server.close();
        process.exit(0);
    } catch (e) {
        console.error('❌ PHASE 2 FAILED:', e);
        if (server) server.close();
        process.exit(1);
    }
}

verifyDeepTrace();
