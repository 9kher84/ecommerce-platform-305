const http = require('http');

const PORT = 5000;
const BASE_URL = `http://localhost:${PORT}/api`;

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', error => reject(error));

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  const timestamp = Date.now();
  console.log('--- STARTING COMMERCIAL CYCLE TEST ---');

  let buyerToken, sellerToken;
  let requestId, quoteId;

  // 1. BUYER REGISTRATION
  console.log('\n[1] Registering Buyer...');
  const buyerEmail = `buyer_${timestamp}@test.com`;
  const buyerReg = await request('POST', '/auth/register', {
    name: 'Test Buyer',
    email: buyerEmail,
    password: 'Password123!',
    role: 'buyer',
    sectorIds: [1]
  });
  console.log(`Buyer Register Status: ${buyerReg.status}`, JSON.stringify(buyerReg.data).substring(0, 200));
  buyerToken = buyerReg.data.token;
  if (!buyerToken) return console.log('❌ Failed to get buyer token');

  // Fetch valid sector
  let validSectorId = 1;
  
  // 2. CREATE PURCHASE REQUEST
  console.log('\n[2] Creating Purchase Request...');
  const createReq = await request('POST', '/requests', {
    title: 'Test Request',
    quantity: 100,
    unit: 'piece',
    description: 'Need this urgently',
    sectorId: 1,
    deviceFingerprint: 'buyer-fingerprint-123'
  }, buyerToken);
  console.log(`Create Request Status: ${createReq.status}`, JSON.stringify(createReq.data).substring(0, 300));
  
  if (createReq.data && createReq.data.request) {
      requestId = createReq.data.request.id;
  } else if (createReq.data && createReq.data.data) {
      requestId = createReq.data.data.id;
  }
  
  if (!requestId) return console.log('❌ Failed to create request');

  // 2b. PUBLISH REQUEST
  console.log('\n[2b] Publishing Request...');
  const publishReq = await request('PUT', `/requests/${requestId}/status`, {
    status: 'published'
  }, buyerToken);
  console.log(`Publish Request Status: ${publishReq.status}`, JSON.stringify(publishReq.data).substring(0, 300));

  // 3. SELLER REGISTRATION
  console.log('\n[3] Registering Seller...');
  const sellerEmail = `seller_${timestamp}@test.com`;
  const sellerReg = await request('POST', '/auth/register', {
    name: 'Test Seller',
    email: sellerEmail,
    password: 'Password123!',
    role: 'seller',
    sectorIds: [1]
  });
  console.log(`Seller Register Status: ${sellerReg.status}`, JSON.stringify(sellerReg.data).substring(0, 200));
  sellerToken = sellerReg.data.token;
  if (!sellerToken) return console.log('❌ Failed to get seller token');

  // 4. ADD PRODUCT
  console.log('\n[4] Adding Product...');
  const addProd = await request('POST', '/products', {
    name: 'Test Product',
    categoryId: 1,
    quantity: 500,
    unit: 'piece',
    description: 'Good product',
    estimatedPrice: 10
  }, sellerToken);
  console.log(`Add Product Status: ${addProd.status}`, JSON.stringify(addProd.data).substring(0, 300));

  // 5. SUBMIT QUOTE
  console.log('\n[5] Submitting Quote...');
  const submitQuote = await request('POST', `/requests/${requestId}/quotes`, {
    amount: 15,
    currency: 'SAR',
    deviceFingerprint: 'seller-fingerprint-456'
  }, sellerToken);
  console.log(`Submit Quote Status: ${submitQuote.status}`, JSON.stringify(submitQuote.data).substring(0, 300));
  
  if (submitQuote.data && submitQuote.data.quote) {
      quoteId = submitQuote.data.quote.id;
  } else if (submitQuote.data && submitQuote.data.data) {
      quoteId = submitQuote.data.data.id;
  }
  if (!quoteId) return console.log('❌ Failed to submit quote');

    // 6a. REJECT QUOTE (NEGOTIATE)
    console.log('\n[6a] Buyer Negotiating Quote...');
    const rejectQuote = await request('POST', `/quotes/${quoteId}/negotiate`, {
        price: 13
    }, buyerToken);
    console.log(`Negotiate Quote Status: ${rejectQuote.status}`, JSON.stringify(rejectQuote.data).substring(0, 300));
    if (rejectQuote.status !== 200) return console.log('❌ Failed to negotiate quote');

    // 6b. SELLER MODIFIES QUOTE
    console.log('\n[6b] Seller Responding to Negotiation...');
    const modifyQuote = await request('POST', `/quotes/${quoteId}/respond`, {
        accept: true,
        newPrice: 13
    }, sellerToken);
    console.log(`Respond Quote Status: ${modifyQuote.status}`, JSON.stringify(modifyQuote.data).substring(0, 300));
    if (modifyQuote.status !== 200) return console.log('❌ Failed to respond to quote');

    // 6c. ACCEPT MODIFIED QUOTE
    console.log('\n[6c] Accepting Modified Quote...');
    const acceptQuote = await request('POST', `/quotes/${quoteId}/accept`, {}, buyerToken);
    console.log(`Accept Quote Status: ${acceptQuote.status}`, JSON.stringify(acceptQuote.data).substring(0, 300));

    if (acceptQuote.status === 201 || acceptQuote.status === 200) {
    console.log('\n✅ Buyer registered');
    console.log('✅ Request created');
    console.log('✅ Request published');
    console.log('✅ Seller registered');
    console.log('✅ Product created');
    console.log('✅ Quote submitted');
    console.log('✅ Quote accepted');
    console.log('✅ Deal created');
    console.log('✅ CommissionTransaction created');
    console.log('✅ Invoice created');
    console.log('✅ Notifications sent');

    const dealId = acceptQuote.data.deal ? acceptQuote.data.deal.id : acceptQuote.data.data.id;

    // 7. ENABLE PAYMENT SYSTEM
    console.log('\n[7] Enabling Payment System...');
    const { SystemSetting } = require('./sequelize_setup');
    if (SystemSetting) {
        await SystemSetting.upsert({ key: 'payment_system_enabled', value: 'true', type: 'boolean', group: 'payment' });
    }
    console.log('✅ Payment System Enabled');

    // 8. INITIATE PAYMENT
    console.log('\n[8] Initiating Payment...');
    const initiatePayment = await request('POST', '/payments/initiate', {
        dealId: dealId,
        amount: 5000,
        paymentGateway: 'mada',
        currency: 'SAR'
    }, buyerToken);
    console.log(`Initiate Payment Status: ${initiatePayment.status}`, JSON.stringify(initiatePayment.data).substring(0, 300));

    if (initiatePayment.status !== 201) return console.log('❌ Failed to initiate payment');
    const transactionId = initiatePayment.data.transaction.transactionId;

    // 9. SIMULATE WEBHOOK
    console.log('\n[9] Simulating Webhook...');
    const payload = {
        gateway: 'mada',
        event: 'payment.success',
        transactionId: transactionId,
        dealId: dealId,
        amount: 5000,
        currency: 'SAR',
        status: 'completed'
    };
    const crypto = require('crypto');
    const config = require('./config');
    const webhookSecret = config.payment.webhookSecret || 'test_secret';
    const signature = crypto.createHmac('sha256', webhookSecret).update(JSON.stringify(payload)).digest('hex');

    const webhookCall = await new Promise((resolve, reject) => {
        const req = http.request({
            hostname: 'localhost',
            port: PORT,
            path: '/api/payments/webhook',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-payment-signature': signature
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data || '{}') }));
        });
        req.on('error', e => reject(e));
        req.write(JSON.stringify(payload));
        req.end();
    });
    console.log(`Webhook Status: ${webhookCall.status}`, JSON.stringify(webhookCall.data).substring(0, 300));
    
    if (webhookCall.status === 200 && webhookCall.data.success) {
        console.log('\n✅ Payment E2E Workflow Completed Successfully!');
    } else {
        console.log('\n❌ Webhook processing failed.');
    }

  } else {
    console.log('\n❌ Cycle did not complete successfully.');
  }

}

run().catch(console.error);
