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

async function verifyOwnerPhase1() {
    console.log('👑 VERIFYING OWNER PHASE 1 APIs (Trace & Force)...');
    let server;

    try {
        await sequelize.authenticate();
        await app.startServer(false);

        server = http.createServer(app);
        await new Promise(resolve => server.listen(0, resolve));
        const port = server.address().port;
        console.log(`✅ Server Up on ${port}`);

        // Login
        const resLogin = await makeRequest(port, 'POST', '/api/owner/bootstrap-login');
        const cookie = resLogin.headers['set-cookie'][0].split(';')[0];
        console.log('✅ Login Success');

        // 1. Trace Engine
        console.log('\n🔍 1. Testing Trace Engine...');
        const user = await User.findOne({ where: { role: 'buyer' } });
        // Fetch Category
        const category = await require('../backend/sequelize_setup').Category.findOne();

        const request = await PurchaseRequest.create({
            userId: user.id,
            title: 'Trace Test',
            status: 'draft',
            categoryId: category ? category.id : 1 // Use existing or fallback 
        });

        // Trace: User vs Request (Update) -> Should ALLOW (Policy: Owner can update)
        const tracePayload = {
            userId: user.id,
            resourceType: 'Request',
            resourceId: request.id,
            action: 'update'
        };
        const resTrace = await makeRequest(port, 'POST', '/api/owner/policy/trace', cookie, tracePayload);

        console.log('Trace Result:', JSON.stringify(resTrace.body, null, 2));

        if (resTrace.body.result === 'ALLOW') {
            console.log('✅ Trace Engine: Correctly Traced ALLOW');
        } else {
            throw new Error('Trace Failed');
        }

        // 2. Force Transition
        console.log('\n💪 2. Testing Force Transition...');
        // Force 'draft' -> 'accepted' (Illegal in Service)
        const forcePayload = { to: 'accepted', reason: 'Sovereign Override' };
        const resForce = await makeRequest(port, 'POST', `/api/owner/requests/${request.id}/force-transition`, cookie, forcePayload);

        if (resForce.status === 200) {
            const updatedReq = await PurchaseRequest.findByPk(request.id);
            if (updatedReq.status === 'accepted') {
                console.log('✅ Force Transition: SUCCESS (Draft -> Accepted)');
            } else {
                throw new Error('Force Transition: DB not updated');
            }
        } else {
            throw new Error(`Force Transition Failed: ${resForce.status}`);
        }

        // 3. Get All Quotes
        const resQuotes = await makeRequest(port, 'GET', '/api/owner/quotes', cookie);
        if (resQuotes.status === 200) {
            console.log(`✅ Get Quotes: SUCCESS (${resQuotes.body.length} items)`);
        } else {
            throw new Error('Get Quotes Failed');
        }

        console.log('\n🟢 PHASE 1 VERIFIED.');
        server.close();
        process.exit(0);
    } catch (e) {
        console.error('❌ PHASE 1 FAILED:', e);
        if (server) server.close();
        process.exit(1);
    }
}

verifyOwnerPhase1();
