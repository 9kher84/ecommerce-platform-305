const https = require('https');

const baseURL = 'https://ecommerce-backend-305.onrender.com/api';

async function fetchJSON(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      const setCookie = res.headers['set-cookie'];
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, setCookie });
        } catch (e) {
          resolve({ status: res.statusCode, data, setCookie });
        }
      });
    });
    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function testEndpoints() {
  console.log("Waiting 30 seconds for Render to deploy...");
  await new Promise(r => setTimeout(r, 30000)); // wait for deploy

  console.log("Logging in as seller1@test.com...");
  const loginRes = await fetchJSON(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'seller1@test.com', password: '123' }) // Or 123456? I'll try 123456 if 123 fails
  });

  if (loginRes.status !== 200) {
    console.log("Login failed with 123, trying 123456...");
    const loginRes2 = await fetchJSON(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'seller1@test.com', password: '123456' })
    });
    if (loginRes2.status !== 200) {
      console.log("Login failed:", loginRes2);
      return;
    }
    var cookie = loginRes2.setCookie ? loginRes2.setCookie[0] : `token=${loginRes2.data.token}`;
  } else {
    var cookie = loginRes.setCookie ? loginRes.setCookie[0] : `token=${loginRes.data.token}`;
  }

  console.log("✅ Login Success");

  console.log("\nTesting GET /api/quotes/my-quotes...");
  const quotesRes = await fetchJSON(`${baseURL}/quotes/my-quotes`, {
    method: 'GET',
    headers: { 'Cookie': cookie, 'Authorization': `Bearer ${cookie.split(';')[0].split('=')[1]}` }
  });
  console.log("Status:", quotesRes.status);
  console.log("Data (Truncated):", JSON.stringify(quotesRes.data).substring(0, 200));

  console.log("\nTesting GET /api/requests/published?page=1&limit=9...");
  const requestsRes = await fetchJSON(`${baseURL}/requests/published?page=1&limit=9`, {
    method: 'GET',
    headers: { 'Cookie': cookie, 'Authorization': `Bearer ${cookie.split(';')[0].split('=')[1]}` }
  });
  console.log("Status:", requestsRes.status);
  console.log("Data (Truncated):", JSON.stringify(requestsRes.data).substring(0, 200));
}

testEndpoints();
