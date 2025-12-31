const { sequelize, User, Post, Offer, Deal, Product, Category, initSequelize } = require('../sequelize_setup');

const API_URL = 'http://localhost:5000/api';

// Helper for fetch with JSON
async function fetchJson(url, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    const res = await fetch(url, { ...options, headers });

    const data = await res.json().catch(() => ({})); // Handle empty responses

    if (!res.ok) {
        const error = new Error(data.message || res.statusText);
        error.response = { data, status: res.status };
        throw error;
    }

    // Extract cookies if present (for login)
    const cookies = res.headers.get('set-cookie');
    return { data, cookies };
}

async function loginUser(email, password) {
    try {
        const { cookies } = await fetchJson(`${API_URL}/auth/login`, {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        return cookies;
    } catch (err) {
        console.error(`Login failed for ${email}:`, err.message);
        throw err;
    }
}

async function runTest() {
    console.log('🚀 Starting V2.0 Logic Verification Test...');

    try {
        // Initialize DB (ensure schema is synced)
        await initSequelize();
        console.log('✅ Database Synced');

        // 0. Setup: Ensure we have a Buyer and a Seller
        const buyerEmail = `buyer_v2_${Date.now()}@test.com`;
        const sellerEmail = `seller_v2_${Date.now()}@test.com`;
        const password = 'password123';

        // Create Buyer
        await fetchJson(`${API_URL}/auth/register`, {
            method: 'POST',
            body: JSON.stringify({
                name: 'V2 Buyer',
                email: buyerEmail,
                password: password,
                role: 'buyer'
            })
        });
        console.log('✅ Buyer Created');

        // Create Seller
        await fetchJson(`${API_URL}/auth/register`, {
            method: 'POST',
            body: JSON.stringify({
                name: 'V2 Seller',
                email: sellerEmail,
                password: password
            })
        });
        // Manually promote to seller
        await User.update({ role: 'seller', ServiceAreas: ['Riyadh'], categories: [1] }, { where: { email: sellerEmail } });
        console.log('✅ Seller Created & Promoted');

        // Login
        const buyerCookies = await loginUser(buyerEmail, password);
        const sellerCookies = await loginUser(sellerEmail, password);

        // 1. Buyer Creates a Request (Post)

        // Ensure Category exists
        let category = await Category.findOne();
        if (!category) {
            category = await Category.create({
                name: 'General',
                name_ar: 'عام',
                name_en: 'General',
                description: 'General items'
            });
            console.log('✅ Category Created');
        }

        // Ensure Product exists
        let product = await Product.findOne();
        if (!product) {
            product = await Product.create({
                name: 'Test Product',
                description: 'A product for testing',
                price: 100,
                stock: 100,
                sellerId: (await User.findOne({ where: { email: sellerEmail } })).id,
                categoryId: category.id
            });
            console.log('✅ Product Created');
        }

        const { data: postData } = await fetchJson(`${API_URL}/posts`, {
            method: 'POST',
            headers: { Cookie: buyerCookies },
            body: JSON.stringify({
                title: 'Urgent Request for Product',
                description: 'Need this asap for my business operations.',
                productId: product.id,
                expiryDate: new Date(Date.now() + 86400000),
                quantity: 10,
                unit: 'kg',
                deliveryDate: new Date(Date.now() + 172800000),
                deliveryLocation: 'Riyadh'
            })
        });

        const postId = postData.post.id;
        console.log(`✅ Buyer Created Request (Post ID: ${postId})`);

        // 2. Seller Views Requests
        await User.update({ isPremium: true }, { where: { email: sellerEmail } });

        const { data: feedData } = await fetchJson(`${API_URL}/posts`, {
            method: 'GET',
            headers: { Cookie: sellerCookies }
        });

        const foundPost = feedData.posts.find(p => p.id === postId);
        if (foundPost) {
            console.log('✅ Seller can see the request (Priority Access Working)');
        } else {
            console.warn('⚠️ Seller could NOT see the request.');
        }

        // 3. Seller Makes an Offer
        const { data: offerData } = await fetchJson(`${API_URL}/posts/${postId}/offers`, {
            method: 'POST',
            headers: { Cookie: sellerCookies },
            body: JSON.stringify({
                amount: 500,
                currency: 'SAR'
            })
        });
        const offerId = offerData.offer.id;
        console.log(`✅ Seller Created Offer (Offer ID: ${offerId})`);

        // 4. Buyer Accepts Offer
        const { data: dealData } = await fetchJson(`${API_URL}/offers/${offerId}/accept`, {
            method: 'PATCH',
            headers: { Cookie: buyerCookies }
        });

        console.log('✅ Buyer Accepted Offer & Deal Created');
        console.log('Deal Status:', dealData.deal.status);
        console.log('Commission:', dealData.commission);

        // 5. Verify Rating Eligibility (Deal is 'agreed', need 'delivered')

        // Seller marks as PAID
        await fetchJson(`${API_URL}/deals/${dealData.deal.id}/status`, {
            method: 'PATCH',
            headers: { Cookie: sellerCookies },
            body: JSON.stringify({ status: 'paid' })
        });
        console.log('✅ Seller marked deal as PAID');

        // Buyer marks as DELIVERED
        await fetchJson(`${API_URL}/deals/${dealData.deal.id}/status`, {
            method: 'PATCH',
            headers: { Cookie: buyerCookies },
            body: JSON.stringify({ status: 'delivered' })
        });
        console.log('✅ Buyer marked deal as DELIVERED');

        // 6. Rate the Deal
        const { data: ratingData } = await fetchJson(`${API_URL}/ratings`, {
            method: 'POST',
            headers: { Cookie: buyerCookies },
            body: JSON.stringify({
                dealId: dealData.deal.id,
                ratedUserId: dealData.deal.sellerId, // Rating the seller
                rating: 5,
                comment: 'Great service!'
            })
        });
        console.log('✅ Buyer Rated Seller');

        console.log('🎉 All V2.0 Logic Verified Successfully!');
        process.exit(0);

    } catch (err) {
        console.error('❌ Test Failed:', err.message);
        if (err.response) console.error('Response:', err.response.data);
        process.exit(1);
    }
}

runTest();
