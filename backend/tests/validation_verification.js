const baseUrl = 'http://localhost:5000/api';

async function runTests() {
    console.log('🚀 Starting Validation Verification Tests...');

    try {
        // 1. Use Seeded Seller
        console.log('\n👤 Using Seeded Seller...');
        const sellerEmail = 'seeded_seller@test.com';
        // Skip registration
        // const sellerRes = await fetch...

        // 2. Login Seller
        console.log('\n🔑 Logging in Seller...');
        const loginRes = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: sellerEmail,
                password: 'password123'
            })
        });
        const loginData = await loginRes.json();
        console.log('Login Status:', loginRes.status);
        const token = loginData.token; // Assuming token is returned in body or cookie. 
        // If cookie, fetch handles it if we use a cookie jar, but here we might need to extract it.
        // Based on authController, it sends token in response body too? Let's check.
        // authController: sendTokenResponse -> res.status(statusCode).json({ success: true, token, user: ... })
        // So token is in body.

        if (!token) {
            console.error('❌ Failed to get token. Aborting tests.');
            return;
        }

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        // 3. Test Create Post - Invalid Data (Missing Title)
        console.log('\n📝 Testing Create Post (Invalid - Missing Title)...');
        const invalidPostRes = await fetch(`${baseUrl}/posts`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                description: 'A great product',
                startingPrice: 100,
                productId: 1, // Assuming product 1 exists or validation runs before DB check
                expiryDate: new Date(Date.now() + 86400000).toISOString()
            })
        });
        const invalidPostData = await invalidPostRes.json();
        console.log('Status:', invalidPostRes.status);
        console.log('Response:', invalidPostData);
        if (invalidPostRes.status === 400 && invalidPostData.message.includes('العنوان مطلوب')) {
            console.log('✅ Validation Passed: Missing title rejected.');
        } else {
            console.log('❌ Validation Failed: Expected 400 with error message.');
        }

        // 4. Test Create Post - Invalid Data (Negative Price)
        console.log('\n📝 Testing Create Post (Invalid - Negative Price)...');
        const negativePriceRes = await fetch(`${baseUrl}/posts`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                title: 'Valid Title',
                description: 'A great product',
                startingPrice: -50,
                productId: 1,
                expiryDate: new Date(Date.now() + 86400000).toISOString()
            })
        });
        const negativePriceData = await negativePriceRes.json();
        console.log('Status:', negativePriceRes.status);
        console.log('Response:', negativePriceData);
        if (negativePriceRes.status === 400 && negativePriceData.message.includes('السعر الابتدائي')) {
            console.log('✅ Validation Passed: Negative price rejected.');
        } else {
            console.log('❌ Validation Failed: Expected 400 with error message.');
        }

        // 5. Test Create Offer - Invalid Data (Missing Amount) - Need to be buyer
        // For simplicity, we'll try with seller token (should fail 403 first, but if we pass that, validation comes next?)
        // Middleware order: protect -> restrictTo -> validateCreateOffer.
        // So we need a buyer token to reach validation.

        console.log('\n👤 Registering Buyer...');
        const buyerEmail = `buyer_${Date.now()}@test.com`;
        await fetch(`${baseUrl}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Test Buyer', email: buyerEmail, password: 'password123' })
        });

        const buyerLoginRes = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: buyerEmail, password: 'password123' })
        });
        const buyerData = await buyerLoginRes.json();
        const buyerToken = buyerData.token;
        const buyerHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${buyerToken}` };

        console.log('\n💰 Testing Create Offer (Invalid - Non-numeric Amount)...');
        // We need a valid post ID for the route /api/posts/:postId/offers
        // We can't easily create a post without a product. 
        // But validation middleware runs BEFORE controller logic (which checks DB).
        // So even with invalid postId, validation should run on body first?
        // Actually, route is /:postId/offers. 
        // Middleware `validateCreateOffer` validates req.body.
        // So we can use any dummy ID.
        const dummyPostId = 99999;
        const invalidOfferRes = await fetch(`${baseUrl}/posts/${dummyPostId}/offers`, {
            method: 'POST',
            headers: buyerHeaders,
            body: JSON.stringify({
                amount: "not-a-number"
            })
        });
        const invalidOfferData = await invalidOfferRes.json();
        console.log('Status:', invalidOfferRes.status);
        console.log('Response:', invalidOfferData);
        if (invalidOfferRes.status === 400) {
            console.log('✅ Validation Passed: Invalid amount rejected.');
        } else {
            console.log('❌ Validation Failed: Expected 400.');
        }

    } catch (error) {
        console.error('❌ Test Error:', error);
    }
}

runTests();
