/**
 * Production Smoke Test (Sovereign)
 * 
 * Verifies key access control gates before going live.
 * Usage: node scripts/internal/smoke_test.js
 */

const BASE_URL = process.env.API_URL || 'http://localhost:5000/api';
// In Prod, these would be real tokens or we just verify rejection
const MOCK_TOKEN = 'test-token';

const check = async (name, fn) => {
    try {
        await fn();
        console.log(`✅ [PASS] ${name}`);
    } catch (err) {
        console.error(`❌ [FAIL] ${name}: ${err.message}`);
        // process.exit(1); // Don't exit, show all failures
    }
};

const run = async () => {
    console.log('🔥 Starting Sovereign Smoke Test...');

    // 1. Public Access -> Owner API (Expect 401/403)
    await check('Public Access Blocked', async () => {
        const res = await fetch(`${BASE_URL}/owner/audit-logs`);
        if (res.status !== 401 && res.status !== 403) throw new Error(`Expected 401/403, got ${res.status}`);
    });

    // 2. Kill Switch Response (Manual Verification usually, but we check if route exists)
    await check('Owner Routes Active (Unless Killswitch Noted)', async () => {
        const res = await fetch(`${BASE_URL}/owner/whoami`); // Or similiar
        // If 503, Killswitch is ON. If 401, Route is active but secured.
        if (res.status === 404) throw new Error('Owner routes vanished (404).');
        if (res.status === 503) console.warn('⚠️ [WARN] Kill Switch is ACTIVE (503).');
    });

    console.log('Smoke Test Complete.');
};

run();
