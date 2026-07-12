const http = require('http');
const { Deal, User } = require('./sequelize_setup');

const PORT = 5000;

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
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  console.log('--- STARTING DELIVERY & RATING E2E ---');

  const deal = await Deal.findOne({ order: [['createdAt', 'DESC']] });
  if (!deal) return console.log('❌ No deal found');
  
  const buyer = await User.findByPk(deal.buyerId);
  const seller = await User.findByPk(deal.sellerId);

  console.log(`✅ Found Deal: ${deal.id}`);
  
  console.log('\n[1] Logging in Seller via API...');
  const sellerLogin = await request('POST', '/auth/login', { email: seller.email, password: 'Password123!' });
  if (sellerLogin.status !== 200) return console.log('❌ Failed to login seller');
  const sellerToken = sellerLogin.data.token;
  console.log('✅ Seller logged in successfully');

  console.log('\n[2] Logging in Buyer via API...');
  const buyerLogin = await request('POST', '/auth/login', { email: buyer.email, password: 'Password123!' });
  if (buyerLogin.status !== 200) return console.log('❌ Failed to login buyer');
  const buyerToken = buyerLogin.data.token;
  console.log('✅ Buyer logged in successfully');

  console.log('\n[3] Seller marking deal as delivered...');
  const deliveryStatus = await request('PATCH', `/deals/${deal.id}/status`, {
      status: 'delivered'
  }, sellerToken);
  console.log(`Delivery Status: ${deliveryStatus.status}`, JSON.stringify(deliveryStatus.data).substring(0, 300));

  if (deliveryStatus.status !== 200) return console.log('❌ Failed to update deal status to delivered');

  console.log('\n[4] Buyer reviewing Seller...');
  const buyerRating = await request('POST', '/ratings', {
      dealId: deal.id,
      ratedUserId: seller.id,
      rating: 5,
      comment: 'Excellent seller, highly recommended! (E2E Test)'
  }, buyerToken);
  console.log(`Buyer Rating Status: ${buyerRating.status}`, JSON.stringify(buyerRating.data).substring(0, 300));

  console.log('\n[5] Seller reviewing Buyer...');
  const sellerRating = await request('POST', '/ratings', {
      dealId: deal.id,
      ratedUserId: buyer.id,
      rating: 4,
      comment: 'Great buyer, fast payment. (E2E Test)'
  }, sellerToken);
  console.log(`Seller Rating Status: ${sellerRating.status}`, JSON.stringify(sellerRating.data).substring(0, 300));

  console.log('\n✅ Delivery & Rating E2E Workflow Completed Successfully!');
}

run().catch(console.error);
