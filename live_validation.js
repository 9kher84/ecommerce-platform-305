/**
 * Live Validation Script
 * Purpose: Prove that Login + Purchase Request creation works on Production
 * 
 * This script:
 * 1. Sends POST /api/auth/login and captures full HTTP transaction
 * 2. Uses the returned JWT to send POST /api/requests
 * 3. Prints every detail: request headers, request body, response status, 
 *    response headers, response body
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
    console.log(`>>> REQUEST: ${method} https://${BASE_URL}${path}`);
    console.log(`>>> TIMESTAMP: ${new Date().toISOString()}`);
    console.log('>>> REQUEST HEADERS:');
    Object.entries(headers).forEach(([k, v]) => {
      console.log(`>>>   ${k}: ${v}`);
    });
    if (bodyStr) {
      console.log(`>>> REQUEST BODY (${Buffer.byteLength(bodyStr)} bytes):`);
      console.log(`>>>   ${bodyStr}`);
    }
    console.log('-'.repeat(80));

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log(`<<< RESPONSE STATUS: ${res.statusCode} ${res.statusMessage}`);
        console.log('<<< RESPONSE HEADERS:');
        Object.entries(res.headers).forEach(([k, v]) => {
          console.log(`<<<   ${k}: ${v}`);
        });
        console.log(`<<< RESPONSE BODY (${Buffer.byteLength(data)} bytes):`);
        console.log(`<<<   ${data}`);
        console.log('='.repeat(80));
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    });

    req.on('error', (e) => {
      console.error(`!!! REQUEST ERROR: ${e.message}`);
      reject(e);
    });

    req.setTimeout(30000, () => {
      console.error('!!! REQUEST TIMEOUT after 30s');
      req.destroy();
      reject(new Error('Timeout'));
    });

    if (bodyStr) {
      req.write(bodyStr);
    }
    req.end();
  });
}

async function main() {
  console.log('');
  console.log('######################################################################');
  console.log('#  LIVE VALIDATION - Production Purchase Request Creation Test        #');
  console.log(`#  Started: ${new Date().toISOString()}                        #`);
  console.log('######################################################################');
  console.log('');

  // ─── STEP 1: Login ───
  console.log('');
  console.log('██ STEP 1: LOGIN as buyer_test_01@test.com');
  console.log('');

  const loginBody = {
    email: 'buyer_test_01@test.com',
    password: 'password123'
  };

  let loginResult;
  try {
    loginResult = await httpRequest('POST', '/api/auth/login', loginBody, null);
  } catch (e) {
    console.error('FATAL: Login request failed with network error:', e.message);
    process.exit(1);
  }

  if (loginResult.status !== 200) {
    console.log('');
    console.log('!! LOGIN FAILED - Status was not 200.');
    console.log(`!! Actual status: ${loginResult.status}`);
    console.log('!! Cannot proceed to Step 2 without a valid token.');
    
    // Try alternative buyer accounts
    const alternativeAccounts = [
      { email: 'buyer@test.com', password: 'password123' },
      { email: 'test@test.com', password: 'password123' },
      { email: 'buyer@example.com', password: 'Password123!' },
    ];
    
    for (const alt of alternativeAccounts) {
      console.log('');
      console.log(`!! Trying alternative account: ${alt.email}`);
      try {
        loginResult = await httpRequest('POST', '/api/auth/login', alt, null);
        if (loginResult.status === 200) {
          console.log(`!! SUCCESS with ${alt.email}`);
          break;
        }
      } catch (e) {
        console.log(`!! Failed: ${e.message}`);
      }
    }
    
    if (loginResult.status !== 200) {
      console.log('');
      console.log('CONCLUSION: No buyer account could log in successfully.');
      console.log('The system login is NOT working for any tested buyer account.');
      process.exit(1);
    }
  }

  // Extract token
  let parsed;
  try {
    parsed = JSON.parse(loginResult.body);
  } catch (e) {
    console.log('!! Could not parse login response as JSON:', e.message);
    process.exit(1);
  }

  const token = parsed.token || parsed.accessToken || (parsed.data && parsed.data.token);
  if (!token) {
    console.log('');
    console.log('!! LOGIN response did not contain a token.');
    console.log('!! Parsed response keys:', Object.keys(parsed));
    console.log('!! Full parsed response:', JSON.stringify(parsed, null, 2));
    process.exit(1);
  }

  console.log('');
  console.log(`✅ LOGIN SUCCESSFUL - Token received (first 40 chars): ${token.substring(0, 40)}...`);
  console.log('');

  // ─── STEP 2: Create Purchase Request ───
  console.log('');
  console.log('██ STEP 2: CREATE PURCHASE REQUEST');
  console.log('');

  const requestBody = {
    title: 'Live Validation Test Request',
    categoryId: 1,
    description: 'Automated live validation - proving system works',
    budget: 500,
    quantity: 10,
    unit: 'piece'
  };

  let createResult;
  try {
    createResult = await httpRequest('POST', '/api/requests', requestBody, token);
  } catch (e) {
    console.error('FATAL: Create request failed with network error:', e.message);
    process.exit(1);
  }

  console.log('');
  if (createResult.status === 201 || createResult.status === 200) {
    console.log(`✅ PURCHASE REQUEST CREATED SUCCESSFULLY - HTTP ${createResult.status}`);
  } else {
    console.log(`❌ PURCHASE REQUEST FAILED - HTTP ${createResult.status}`);
  }

  console.log('');
  console.log('######################################################################');
  console.log('#  LIVE VALIDATION COMPLETE                                           #');
  console.log(`#  Finished: ${new Date().toISOString()}                       #`);
  console.log('######################################################################');
}

main().catch((e) => {
  console.error('Unhandled error:', e);
  process.exit(1);
});
