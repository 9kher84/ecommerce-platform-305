const http = require('http');
const app = require('../backend/server'); // Correct path relative to scripts/
const { sequelize, User } = require('../backend/sequelize_setup');

const OWNER_ID = process.env.OWNER_ID || '11111111-1111-1111-1111-111111111111';

// Simple wrapper for HTTP Request
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
        // Auth via Cookie only (Strict Security Hardening)
        if (cookie) options.headers['Cookie'] = cookie;

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                let parsed = data;
                try {
                    parsed = JSON.parse(data);
                } catch (e) {
                    // keep as string
                }
                resolve({
                    status: res.statusCode,
                    body: parsed,
                    headers: res.headers // Return headers to capture Set-Cookie
                });
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function verifyOwnerPanel() {
    console.log('👑 VERIFYING OWNER CONTROL PANEL (Native HTTP)...');
    let server;

    try {
        await sequelize.authenticate();

        // Initialize App Routes & DB (but don't listen internally)
        await app.startServer(false);

        // Start Server on random port
        server = http.createServer(app);
        await new Promise(resolve => server.listen(0, resolve));
        const port = server.address().port;
        console.log(`✅ Test Server running on port ${port}`);

        // 1. Bootstrap Login (Owner)
        console.log('\n--- 1. Bootstrap Login ---');
        const resBootstrap = await makeRequest(port, 'POST', '/api/owner/bootstrap-login');

        if (resBootstrap.status !== 200) {
            throw new Error(`Bootstrap Login Failed: ${resBootstrap.status} - ${JSON.stringify(resBootstrap.body)}`);
        }

        // Capture Cookie
        let cookie = null;
        if (resBootstrap.headers && resBootstrap.headers['set-cookie']) {
            const rawCookie = resBootstrap.headers['set-cookie'][0];
            cookie = rawCookie.split(';')[0]; // simple 'token=...'
            console.log('✅ Bootstrap Success. Cookie received:', cookie);
        } else {
            throw new Error('No Cookie received from Bootstrap!');
        }

        // 2. Verified Access (Get Users)
        console.log('\n--- 2. Sovereign Access (GET /users) ---');
        const resUsers = await makeRequest(port, 'GET', '/api/owner/users', cookie);

        if (resUsers.status === 200) {
            console.log(`✅ Access Granted. Retrieved ${resUsers.body.length} users.`);
        } else {
            console.log('Response:', resUsers.body);
            throw new Error(`Owner Access Failed: ${resUsers.status}`);
        }

        // 3. Chaos Test (Tech Admin Access)
        console.log('\n--- 3. Chaos Test: Staff Intrusion ---');
        // Tech Admin Cookie
        const techAdmin = await User.findOne({ where: { email: 'tech@platform.internal' } });
        if (!techAdmin) throw new Error('Tech Admin not found');
        const techToken = techAdmin.getSignedJwtToken();
        const techCookie = `token=${techToken}`;

        const resIntrusion = await makeRequest(port, 'GET', '/api/owner/users', techCookie);

        if (resIntrusion.status === 403) {
            console.log('✅ Intrusion Blocked (403 Forbidden).');
        } else {
            console.error(`❌ CHAOS FAIL: Staff accessed Owner Panel! Status: ${resIntrusion.status}`);
            throw new Error('Security Breach');
        }

        console.log('\n✅ OWNER PANEL VERIFICATION COMPLETE.');
        server.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ VERIFICATION FAILED:', error);
        if (server) server.close();
        process.exit(1);
    }
}

verifyOwnerPanel();
