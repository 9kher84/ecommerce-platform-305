const axios = require('axios');
const fs = require('fs');

async function testAuthFlow() {
    console.log('🧪 Starting Auth Flow Test...');
    const baseURL = 'http://localhost:5000/api';

    try {
        // 1. Login
        console.log('\n📝 1. Testing Login...');
        const loginRes = await axios.post(`${baseURL}/auth/login`, {
            email: 'owner@test.com',
            password: '123456'
        });

        // 2. Check Body
        console.log('   Response Body keys:', Object.keys(loginRes.data));
        if (loginRes.data.token) {
            console.error('   ❌ FAILURE: Token found in response body!');
        } else {
            console.log('   ✅ SUCCESS: Token NOT in response body.');
        }

        // 3. Check Cookies
        const setCookie = loginRes.headers['set-cookie'];
        if (setCookie) {
            console.log('   ✅ SUCCESS: Set-Cookie header present:', setCookie);
            // Verify attributes
            const cookieStr = setCookie[0];
            if (cookieStr.includes('HttpOnly') && cookieStr.includes('Secure') && cookieStr.includes('SameSite=Strict')) {
                console.log('   ✅ SUCCESS: Cookie attributes correct (HttpOnly; Secure; SameSite=Strict).');
            } else {
                console.warn('   ⚠️ WARNING: Check cookie attributes manually:', cookieStr);
            }
        } else {
            console.error('   ❌ FAILURE: No Set-Cookie header!');
            return; // Cannot proceed
        }

        // Extract token for next request (simulating browser behavior)
        const cookie = setCookie[0].split(';')[0]; // "token=..."

        // 4. Protected Route
        console.log('\n🛡️ 2. Testing Protected Route (/api/auth/me) with Cookie...');
        try {
            const meRes = await axios.get(`${baseURL}/auth/me`, {
                headers: {
                    Cookie: cookie
                }
            });
            console.log('   ✅ SUCCESS: Accessed protected route. User:', meRes.data.data.email);
        } catch (meErr) {
            console.error('   ❌ FAILURE: Could not access protected route:', meErr.response ? meErr.response.data : meErr.message);
        }

    } catch (error) {
        console.error('❌ Login Failed:', error.response ? error.response.data : error.message);
    }
}

testAuthFlow();
