const http = require('http');
const { Deal } = require('./sequelize_setup');

const PORT = 5000;

function request(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: PORT,
            path: '/api' + path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (token) {
            options.headers['Authorization'] = 'Bearer ' + token;
        }

        const req = http.request(options, (res) => {
            let resData = '';
            res.on('data', chunk => resData += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(resData || '{}') });
                } catch (e) {
                    resolve({ status: res.statusCode, data: resData });
                }
            });
        });

        req.on('error', e => reject(e));
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function simulateDeliveryAndRating() {
    console.log('--- STARTING DELIVERY AND RATING SIMULATION ---');
    
    // Find a paid deal
    const deal = await Deal.findOne({ where: { status: 'paid' }, order: [['createdAt', 'DESC']] });
    if (!deal) {
        console.log('❌ No deal found in paid state');
        process.exit(1);
    }
    
    console.log(`✅ Found Paid Deal: ${deal.id}`);

    // We need tokens for Buyer and Seller. We can create mock tokens since JWT uses SECRET
    const jwt = require('jsonwebtoken');
    require('dotenv').config();
    const JWT_SECRET = process.env.JWT_SECRET || 'supersecret12345678901234567890123';
    
    const buyerToken = jwt.sign({ id: deal.buyerId, role: 'buyer' }, JWT_SECRET, { expiresIn: '1d' });
    const sellerToken = jwt.sign({ id: deal.sellerId, role: 'seller' }, JWT_SECRET, { expiresIn: '1d' });

    // 1. Mark Deal as Delivered
    console.log('\n[1] Seller marking deal as delivered...');
    const deliveryStatus = await request('PATCH', `/deals/${deal.id}/status`, {
        status: 'delivered'
    }, sellerToken);
    
    console.log(`Delivery Status: ${deliveryStatus.status}`);
    if (deliveryStatus.status !== 200) {
        console.log('❌ Failed to update deal status');
        console.log(deliveryStatus.data);
        return;
    }
    
    // 2. Buyer Rates Seller
    console.log('\n[2] Buyer rating the seller...');
    const buyerRating = await request('POST', `/ratings`, {
        dealId: deal.id,
        rating: 5,
        comment: 'Fast delivery, great communication!'
    }, buyerToken);
    
    console.log(`Buyer Rating Status: ${buyerRating.status}`);
    if (buyerRating.status !== 201) {
        console.log('❌ Failed to submit buyer rating');
        console.log(buyerRating.data);
        return;
    }
    
    // 3. Seller Rates Buyer
    console.log('\n[3] Seller rating the buyer...');
    const sellerRating = await request('POST', `/ratings`, {
        dealId: deal.id,
        rating: 4,
        comment: 'Good buyer, prompt payment.'
    }, sellerToken);
    
    console.log(`Seller Rating Status: ${sellerRating.status}`);
    if (sellerRating.status !== 201) {
        console.log('❌ Failed to submit seller rating');
        console.log(sellerRating.data);
        return;
    }
    
    console.log('\n✅ Delivery & Rating Workflow Completed Successfully!');
}

simulateDeliveryAndRating().catch(console.error);
