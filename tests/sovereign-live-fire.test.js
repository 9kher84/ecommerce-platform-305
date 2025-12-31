const request = require('supertest');
const app = require('../backend/server');
const { AdminCredentialsBackup } = require('../backend/models'); // Will be lazy loaded if not available globally
const logger = require('../backend/config/logger');

describe('🚨 Live Fire Exercise: Honeypot & AI Shield', () => {

    // Command 4: Live Fire Exercise
    test('1. Honeypot Attack triggers Kill Switch in < 100ms', async () => {
        // Need to mock the kill switch to avoid actually killing the test runner process
        const sovereignKillSwitch = require('../backend/scripts/kill-switch');
        const killSpy = jest.spyOn(sovereignKillSwitch, 'isolateDatabase').mockResolvedValue(true);
        const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { });

        const startTime = Date.now();

        // Simulate attack
        try {
            // Trying to use a model that has the hook
            // Note: In a real integration test, we might hit an endpoint,
            // but the honeypot models are mostly internal DB traps.
            // We will simulate the DB access directly or via a "vulnerable" endpoint if one existed.
            // Since we don't have a public endpoint exposing this, we test the Model Hook directly.

            // However, the prompt asks for "simulate_honeytoken_attack.js" script. 
            // This test here validates the mechanic.

            // We need to require models dynamically if they are not exported by server default
            // Assuming we can access the model via standard import after server start

            // Let's rely on the deployed script for the timing, but test the mechanics here.

            // Force trigger
            const { AdminCredentialsBackup } = require('../backend/models/HoneypotModels')(require('../backend/config/database').sequelize);
            await AdminCredentialsBackup.findOne(); // Should trigger hook

        } catch (e) {
            // Expected? The hook calls process.exit, which we mocked.
        }

        const endTime = Date.now();
        const duration = endTime - startTime;

        console.log(`⏱️ Time to React: ${duration}ms`);

        expect(duration).toBeLessThan(100);
        expect(killSpy).toHaveBeenCalled();
        expect(exitSpy).toHaveBeenCalledWith(1);

        killSpy.mockRestore();
        exitSpy.mockRestore();
    });

    // Command 3: AI Shield Verification
    test('2. AI Shield Redacts Sensitive IP and Table Names', async () => {
        const responseStub = {
            data: "User from 192.168.1.50 accessed admin_credentials_backup table.",
            meta: {
                host: "10.0.0.5"
            }
        };

        // We can test the middleware logic by making a request to an endpoint that echoes body
        // Or creating a temporary route

        app.post('/test/ai-echo', (req, res) => {
            res.json(req.body);
        });

        const res = await request(app)
            .post('/test/ai-echo')
            .send(responseStub);

        expect(res.status).toBe(200);

        // Assert Redaction
        expect(res.text).not.toContain('192.168.1.50');
        expect(res.text).not.toContain('10.0.0.5');
        expect(res.text).not.toContain('admin_credentials_backup');

        expect(res.text).toContain('[REDACTED_BY_SOVEREIGN_PROTOCOL]');
    });
});
