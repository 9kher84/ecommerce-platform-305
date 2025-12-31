const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

const jar = new CookieJar();
const client = wrapper(axios.create({
    jar,
    withCredentials: true,
    baseURL: 'http://localhost:5000/api'
}));

// Test credentials
const sellerEmail = 'owner@test.com'; // Now updated to seller role
const sellerPassword = '123456';

async function runTest() {
    try {
        console.log('=== E) Seller Middleware Test ===\n');

        // 1. Login as Seller
        console.log('--- 1. Login as Seller ---');
        const loginRes = await client.post('/auth/login', {
            email: sellerEmail,
            password: sellerPassword
        });
        console.log('Login Status:', loginRes.status);
        console.log('User Role:', loginRes.data.user.role);

        if (loginRes.data.user.role !== 'seller') {
            console.error('❌ FAIL: User is not a seller. Current role:', loginRes.data.user.role);
            return;
        }
        console.log('✅ PASS: Logged in as seller\n');

        // 2. Test Seller Access to Product Routes
        console.log('--- 2. Test Seller Access (POST /api/products) ---');
        try {
            const productRes = await client.post('/products', {
                name: 'Test Product',
                description: 'Test Description',
                price: 100,
                stock: 10
            }, { validateStatus: () => true });

            console.log('Status:', productRes.status);

            if (productRes.status === 200 || productRes.status === 201) {
                console.log('✅ PASS: Seller can access POST /api/products (Success)');
            } else if (productRes.status === 400 || productRes.status === 500) {
                // Business logic error is acceptable (e.g., validation, missing fields)
                console.log('✅ PASS: Seller can access POST /api/products (Business logic error is OK)');
                console.log('   Response:', productRes.data);
            } else if (productRes.status === 403) {
                console.log('❌ FAIL: Seller was forbidden (403). Middleware not working correctly.');
                console.log('   Response:', productRes.data);
            } else {
                console.log('⚠️ WARNING: Unexpected status:', productRes.status);
                console.log('   Response:', productRes.data);
            }
        } catch (error) {
            console.error('❌ Error accessing product route:', error.message);
        }

        // 3. Logout
        console.log('\n--- 3. Logout ---');
        await client.post('/auth/logout');
        console.log('✅ Logged out\n');

        // 4. Create a buyer user for negative test
        console.log('--- 4. Register as Buyer ---');
        const buyerEmail = 'buyer_test@test.com';
        const buyerPassword = '123456';

        try {
            await client.post('/auth/register', {
                name: 'Buyer Test',
                email: buyerEmail,
                password: buyerPassword,
                role: 'buyer'
            });
            console.log('✅ Buyer registered\n');
        } catch (error) {
            // User might already exist
            console.log('⚠️ Buyer might already exist, continuing...\n');
        }

        // 5. Login as Buyer
        console.log('--- 5. Login as Buyer ---');
        const buyerLoginRes = await client.post('/auth/login', {
            email: buyerEmail,
            password: buyerPassword
        });
        console.log('Login Status:', buyerLoginRes.status);
        console.log('User Role:', buyerLoginRes.data.user.role);
        console.log('✅ PASS: Logged in as buyer\n');

        // 6. Test Buyer Access (Should be Forbidden)
        console.log('--- 6. Test Buyer Access (POST /api/products) - Should Fail ---');
        try {
            const buyerProductRes = await client.post('/products', {
                name: 'Test Product',
                description: 'Test Description',
                price: 100,
                stock: 10
            }, { validateStatus: () => true });

            console.log('Status:', buyerProductRes.status);

            if (buyerProductRes.status === 403) {
                console.log('✅ PASS: Buyer was correctly forbidden (403)');
                console.log('   Message:', buyerProductRes.data.message);

                if (buyerProductRes.data.message && buyerProductRes.data.message.includes('Only sellers')) {
                    console.log('   ✅ Correct error message confirmed');
                }
            } else {
                console.log('❌ FAIL: Buyer was NOT forbidden. Status:', buyerProductRes.status);
                console.log('   Response:', buyerProductRes.data);
            }
        } catch (error) {
            console.error('❌ Error:', error.message);
        }

        console.log('\n=== Test Complete ===');

    } catch (error) {
        console.error('❌ CRITICAL ERROR:', error.response ? error.response.data : error.message);
    }
}

runTest();
