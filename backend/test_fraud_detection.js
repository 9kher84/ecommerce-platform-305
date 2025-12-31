const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

const jar = new CookieJar();
const client = wrapper(axios.create({
    jar,
    withCredentials: true,
    baseURL: 'http://localhost:5000/api'
}));

const buyerEmail = 'buyer_fraud_final@test.com'; // Unique
const sellerEmail = 'owner@test.com'; // Existing seller

async function runFraudTests() {
    console.log('=== K) Fraud Detection Tests (DB Backed) ===\n');

    try {
        // 1. Register/Login Buyer
        console.log('--- 1. Prepare Buyer & Request ---');
        try {
            await client.post('/auth/register', {
                name: 'Fraud Test Buyer',
                email: buyerEmail,
                password: 'password123',
                role: 'buyer'
            });
        } catch (e) {
            await client.post('/auth/login', { email: buyerEmail, password: 'password123' });
        }
        console.log('✅ Buyer Logged In');

        // Create Request WITH Fingerprint
        const buyerFingerprint = 'DEVICE-UNIQUE-BUYER-123';
        const reqHeaders = { 'x-device-fingerprint': buyerFingerprint };

        const reqRes = await client.post('/requests', {
            title: 'Fraud Test Request (DB)',
            description: 'Testing persistent fraud detection',
            categoryId: 1
        }, { headers: reqHeaders });

        const requestId = reqRes.data.request.id;
        console.log(`✅ Request Created: ID ${requestId}`);
        console.log(`   Captured Fingerprint?? (Check DB manually if fail): We sent ${buyerFingerprint}`);

        // Publish Request
        try {
            await client.post(`/requests/${requestId}/publish`);
            console.log('✅ Request Published');
        } catch (e) {
            console.log('⚠️ Publish failed:', e.response ? e.response.data : e.message);
        }

        // Logout Buyer
        await client.post('/auth/logout');

        // 2. Login Seller
        console.log('\n--- 2. Login Seller ---');
        await client.post('/auth/login', { email: sellerEmail, password: '123456' });
        console.log('✅ Seller Logged In');

        // 3. Test Normal Quote (No Match)
        console.log('\n--- 3. Test Normal Quote (No Fraud) ---');
        const sellerFingerprintNormal = 'DEVICE-SELLER-NORMAL-001';

        try {
            await client.post(`/requests/${requestId}/quotes`, {
                priceType: 'fixed',
                fixedPrice: 50
            }, { headers: { 'x-device-fingerprint': sellerFingerprintNormal } });
            console.log('✅ PASS: Normal quote accepted');
        } catch (error) {
            console.log('❌ FAIL: Normal quote rejected:', error.message);
            if (error.response) console.log(JSON.stringify(error.response.data, null, 2));
        }

        // 4. Test Fraud Quote (Self Trading Match)
        console.log('\n--- 4. Test Fraud Quote (Self Trading) ---');
        // Simulate same device as Buyer

        try {
            await client.post(`/requests/${requestId}/quotes`, {
                priceType: 'fixed',
                fixedPrice: 40
            }, { headers: { 'x-device-fingerprint': buyerFingerprint } }); // SAME FINGERPRINT

            console.log('❌ FAIL: Fraudulent quote was ACCEPTED!');
        } catch (error) {
            if (error.response && error.response.status === 403) {
                console.log('✅ PASS: Fraudulent quote rejected (403)');
                console.log('   Error:', error.response.data.message);
            } else {
                console.log('❌ FAIL: Rejected but wrong status:', error.response ? error.response.status : error.message);
                if (error.response) console.log(JSON.stringify(error.response.data, null, 2));
            }
        }

        console.log('\n=== Fraud Tests Complete ===');

    } catch (error) {
        console.error('CRITICAL ERROR:', error.message);
        if (error.response) console.log('Response:', JSON.stringify(error.response.data, null, 2));
    }
}

runFraudTests();
