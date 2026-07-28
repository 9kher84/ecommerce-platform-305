/**
 * Frontend Integration Trace Script
 * Simulates exactly what the frontend does:
 * 1. Login as test@test.com
 * 2. Call GET /api/requests/my-requests (same as entityService.getMyRequests)
 * 3. Display the full response
 * 4. Check if ae400161-e8a4-4e4b-9961-e3af9b07fc36 appears in the response
 */

const https = require('https');

const BASE_URL = 'ecommerce-platform-305.onrender.com';

function httpRequest(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json',
    };
    if (bodyStr) {
      headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      hostname: BASE_URL,
      port: 443,
      path: path,
      method: method,
      headers: headers,
    };

    console.log('='.repeat(80));
    console.log(`>>> ${method} https://${BASE_URL}${path}`);
    console.log(`>>> TIMESTAMP: ${new Date().toISOString()}`);
    console.log('>>> HEADERS:');
    Object.entries(headers).forEach(([k, v]) => {
      // Truncate long auth headers for readability
      const display = v.length > 60 ? v.substring(0, 60) + '...' : v;
      console.log(`>>>   ${k}: ${display}`);
    });
    if (bodyStr) {
      console.log(`>>> BODY: ${bodyStr}`);
    }
    console.log('-'.repeat(80));

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`<<< STATUS: ${res.statusCode} ${res.statusMessage}`);
        console.log(`<<< BODY (${Buffer.byteLength(data)} bytes):`);
        // Pretty print if JSON
        try {
          const parsed = JSON.parse(data);
          console.log(JSON.stringify(parsed, null, 2));
        } catch {
          console.log(data);
        }
        console.log('='.repeat(80));
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    });

    req.on('error', (e) => {
      console.error(`!!! ERROR: ${e.message}`);
      reject(e);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function main() {
  console.log('');
  console.log('################################################################');
  console.log('#  FRONTEND INTEGRATION TRACE                                   #');
  console.log(`#  ${new Date().toISOString()}                            #`);
  console.log('################################################################');

  // ─── STEP 1: Login ───
  console.log('\n█ STEP 1: Login as test@test.com\n');

  const loginResult = await httpRequest('POST', '/api/auth/login', {
    email: 'test@test.com',
    password: 'password123'
  });

  if (loginResult.status !== 200) {
    console.log('FATAL: Login failed.');
    process.exit(1);
  }

  const loginParsed = JSON.parse(loginResult.body);
  const token = loginParsed.token;
  console.log(`\nToken obtained: ${token.substring(0, 40)}...\n`);

  // ─── STEP 2: GET /api/requests/my-requests (what BuyerDrafts calls) ───
  console.log('\n█ STEP 2: GET /api/requests/my-requests (BuyerDrafts component)\n');
  console.log('This is the exact call the frontend makes via:');
  console.log('  BuyerDrafts → useMyRequests({}) → entityService.getMyRequests({})');
  console.log('  → apiClient.get("/api/requests/my-requests", { params: {} })');
  console.log('');

  const myRequestsResult = await httpRequest('GET', '/api/requests/my-requests', null, token);

  // ─── STEP 3: Analyze response ───
  console.log('\n█ STEP 3: ANALYSIS\n');

  const TARGET_ID = 'ae400161-e8a4-4e4b-9961-e3af9b07fc36';

  if (myRequestsResult.status !== 200) {
    console.log(`FAILURE: API returned ${myRequestsResult.status} instead of 200`);
    process.exit(1);
  }

  const parsed = JSON.parse(myRequestsResult.body);

  console.log(`Response success: ${parsed.success}`);
  console.log(`Total records returned: ${parsed.data ? parsed.data.length : 'N/A'}`);
  
  if (parsed.pagination) {
    console.log(`Pagination: page ${parsed.pagination.currentPage} of ${parsed.pagination.totalPages}`);
    console.log(`Total count in DB: ${parsed.pagination.totalCount}`);
  }

  // Check if target request exists
  const allItems = parsed.data || [];
  const found = allItems.find(item => item.id === TARGET_ID);

  if (found) {
    console.log(`\n✅ TARGET REQUEST FOUND in API response!`);
    console.log(`   id: ${found.id}`);
    console.log(`   title: ${found.title}`);
    console.log(`   status: ${found.status}`);
    console.log(`   createdAt: ${found.createdAt}`);
  } else {
    console.log(`\n❌ TARGET REQUEST NOT FOUND in API response.`);
    console.log(`   Searched for id: ${TARGET_ID}`);
    console.log(`   Items in response: ${allItems.length}`);
    if (allItems.length > 0) {
      console.log('\n   Items returned:');
      allItems.forEach((item, i) => {
        console.log(`   [${i}] id=${item.id} title="${item.title}" status=${item.status}`);
      });
    }
  }

  // ─── STEP 4: Simulate BuyerDrafts filter ───
  console.log('\n█ STEP 4: BuyerDrafts FILTER (status === "draft")\n');
  console.log('BuyerDrafts.jsx line 14:');
  console.log('  const drafts = response?.data?.filter(req => req.status === "draft") || [];');

  const drafts = allItems.filter(req => req.status === 'draft');
  console.log(`\nDrafts after filter: ${drafts.length}`);
  
  const targetInDrafts = drafts.find(d => d.id === TARGET_ID);
  if (targetInDrafts) {
    console.log(`✅ TARGET REQUEST PASSES the draft filter → VISIBLE in BuyerDrafts`);
  } else if (found) {
    console.log(`❌ TARGET REQUEST EXCLUDED by draft filter (status = "${found.status}")`);
  } else {
    console.log(`❌ TARGET REQUEST was never in the API response`);
  }

  // ─── STEP 5: Also check RequestsList page ───
  console.log('\n█ STEP 5: GET /api/requests (RequestsList page - all requests)\n');
  
  const allRequestsResult = await httpRequest('GET', '/api/requests', null, token);
  
  if (allRequestsResult.status === 200) {
    const allParsed = JSON.parse(allRequestsResult.body);
    const allData = allParsed.data || allParsed.requests || [];
    const foundInAll = allData.find ? allData.find(item => item.id === TARGET_ID) : null;
    
    console.log(`\nTotal in /api/requests: ${Array.isArray(allData) ? allData.length : 'unknown'}`);
    if (foundInAll) {
      console.log(`✅ TARGET found in /api/requests`);
    } else {
      console.log(`❌ TARGET NOT found in /api/requests`);
    }
  }

  console.log('\n################################################################');
  console.log('#  TRACE COMPLETE                                               #');
  console.log('################################################################\n');
}

main().catch(e => {
  console.error('Fatal:', e);
  process.exit(1);
});
