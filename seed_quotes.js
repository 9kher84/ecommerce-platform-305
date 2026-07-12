module.paths.push('c:\\Users\\s9khr\\sasasa\\ecommerce-platform\\backend\\node_modules');
const axios = require('axios');
const BASE = 'http://localhost:5000';

async function run() {
  // Login seller_a
  const loginA = await axios.post(`${BASE}/api/auth/login`, 
    { email: 'seller_a@test.com', password: 'Test@12345' });
  const tokenA = loginA.data.token;
  console.log('seller_a token:', tokenA ? 'OK' : 'FAILED');

  // Login seller_b  
  const loginB = await axios.post(`${BASE}/api/auth/login`,
    { email: 'seller_b@test.com', password: 'Test@12345' });
  const tokenB = loginB.data.token;
  console.log('seller_b token:', tokenB ? 'OK' : 'FAILED');

  const requests = [
    'cccc0001-0000-0000-0000-000000000001',
    'cccc0002-0000-0000-0000-000000000002', 
    'cccc0003-0000-0000-0000-000000000003',
    'cccc0004-0000-0000-0000-000000000004',
    'cccc0005-0000-0000-0000-000000000005'
  ];

  const headers = (token) => ({ 
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  // seller_a submits quotes on requests 1,2,3
  for (const reqId of requests.slice(0,3)) {
    try {
      const r = await axios.post(`${BASE}/api/quotes`, {
        purchaseRequestId: reqId,
        amount: Math.floor(Math.random() * 5000 + 1000),
        priceType: 'fixed',
        fixedPrice: Math.floor(Math.random() * 5000 + 1000),
        technicalDetails: 'عرض سعر تجريبي من المورد أ',
        deliveryTime: '14',
        warrantyMonths: 12,
        canDeliver: true,
        deliveryCost: 500
      }, { headers: headers(tokenA) });
      console.log(`Quote by seller_a on ${reqId}: ${r.status}`);
    } catch(e) {
      console.log(`Quote failed seller_a on ${reqId}: ${e.response?.data?.message || e.message}`);
    }
  }

  // seller_b submits quotes on requests 3,4,5
  for (const reqId of requests.slice(2,5)) {
    try {
      const r = await axios.post(`${BASE}/api/quotes`, {
        purchaseRequestId: reqId,
        amount: Math.floor(Math.random() * 3000 + 500),
        priceType: 'fixed',
        fixedPrice: Math.floor(Math.random() * 3000 + 500),
        technicalDetails: 'عرض سعر تجريبي من المورد ب',
        deliveryTime: '7',
        warrantyMonths: 6,
        canDeliver: false,
        deliveryCost: 0
      }, { headers: headers(tokenB) });
      console.log(`Quote by seller_b on ${reqId}: ${r.status}`);
    } catch(e) {
      console.log(`Quote failed seller_b on ${reqId}: ${e.response?.data?.message || e.message}`);
    }
  }
}

run().catch(console.error);
