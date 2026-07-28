const fetch = globalThis.fetch;
const assert = require('assert');
const { v4: uuidv4 } = require('uuid');
const { sequelize, User, Role, Organization } = require('../sequelize_setup');

const baseURL = 'http://localhost:5000';

async function setupIsolatedUser(emailPrefix, roleName) {
  const email = `${emailPrefix}_${uuidv4().split('-')[0]}@test.com`;
  const password = 'password123';
  
  // Create User
  const user = await User.create({
    name: `${emailPrefix} User`,
    email,
    password,
    role: roleName, // Legacy column
    isActive: true
  });

  // Assign Role
  const role = await Role.findOne({ where: { name: roleName } });
  if (role) await user.addRole(role);

  // Create Organization
  const org = await Organization.create({
    name: `${emailPrefix} Org`,
    registration_number: uuidv4().split('-')[0],
    is_verified: true
  });
  await user.addOrganization(org, { through: { is_primary: true } });

  return { email, password, user, org };
}

async function runSmokeSuite() {
  console.log("==========================================");
  console.log("   🚀 RUNNING ISOLATED SMOKE SUITE 🚀 ");
  console.log("==========================================\n");

  let buyerCreds, sellerCreds;
  let buyerToken = '', sellerToken = '';
  let purchaseRequestId = '', workPackageId = '', processId = '';

  try {
    console.log("▶ [SETUP] Provisioning Isolated Test Data...");
    buyerCreds = await setupIsolatedUser('smoke_buyer', 'buyer');
    sellerCreds = await setupIsolatedUser('smoke_seller', 'seller');
    console.log(`  ✅ Isolated Buyer created: ${buyerCreds.email}`);
    console.log(`  ✅ Isolated Seller created: ${sellerCreds.email}\n`);

    // ---------------------------------------------------------
    // 1. AUTH SUITE
    // ---------------------------------------------------------
    console.log("▶ [AUTH] Logging in Buyer...");
    const buyerRes = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: buyerCreds.email, password: 'password123' })
    });
    assert.strictEqual(buyerRes.status, 200, "Buyer login failed");
    const buyerData = await buyerRes.json();
    buyerToken = buyerData.token;
    console.log("  ✅ Buyer logged in.");

    console.log("▶ [AUTH] Logging in Seller...");
    const sellerRes = await fetch(`${baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: sellerCreds.email, password: 'password123' })
    });
    assert.strictEqual(sellerRes.status, 200, "Seller login failed");
    const sellerData = await sellerRes.json();
    sellerToken = sellerData.token;
    console.log("  ✅ Seller logged in.\n");

    // ---------------------------------------------------------
    // 2. REQUEST SUITE
    // ---------------------------------------------------------
    console.log("▶ [REQUESTS] Creating Purchase Request...");
    const createReqRes = await fetch(`${baseURL}/api/requests`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${buyerToken}`
      },
      body: JSON.stringify({
        header: {
          title: 'Smoke Test Project',
          description: 'Automated test'
        },
        items: [{ lineNumber: 1, title: 'Steel Works', description: 'Steel', category: 'Steel', quantity: 10, unit: 'TON' }]
      })
    });
    
    assert([200, 201].includes(createReqRes.status), `Create Request failed: ${createReqRes.status}`);
    const reqData = await createReqRes.json();
    console.log("Create Request Response Data:", JSON.stringify(reqData, null, 2));
    purchaseRequestId = reqData.data?.id || reqData.request?.id;
    
    const packages = reqData.data?.items || reqData.data?.packages || reqData.data?.WorkPackages || reqData.request?.items || reqData.request?.WorkPackages;
    workPackageId = packages?.[0]?.id;
    assert.ok(purchaseRequestId, "No Purchase Request ID returned");
    assert.ok(workPackageId, "No WorkPackage ID returned");
    console.log("  ✅ Request created.");

    console.log("▶ [REQUESTS] Publishing Purchase Request...");
    const pubRes = await fetch(`${baseURL}/api/requests/${purchaseRequestId}/publish`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${buyerToken}`
      },
      body: JSON.stringify({ publishAsRFQ: false })
    });
    assert.strictEqual(pubRes.status, 200, `Publish failed: ${pubRes.status}`);
    console.log("  ✅ Request published.\n");

    // Give the async event handlers a second to create the WorkPackage
    await new Promise(r => setTimeout(r, 3000));
    const { WorkPackage } = require('../sequelize_setup');
    const wp = await WorkPackage.findOne({ where: { purchaseRequestId } });
    if (!wp) {
      assert.fail("WorkPackage was not generated after publishing the request.");
    }
    workPackageId = wp.id;
    console.log(`  ✅ WorkPackage found: ${workPackageId}\n`);

    // ---------------------------------------------------------
    // 3. NEGOTIATION SUITE
    // ---------------------------------------------------------
    console.log("▶ [NEGOTIATION] Seller Submitting Proposal...");
    const propRes = await fetch(`${baseURL}/api/v2/negotiations/work-packages/${workPackageId}/proposals`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sellerToken}`
      },
      body: JSON.stringify({
        amount: 50000,
        deliveryDate: new Date().toISOString(),
        notes: "Smoke test proposal"
      })
    });
    
    if (![200, 201].includes(propRes.status)) {
      const propText = await propRes.text();
      assert.fail(`Proposal failed: ${propRes.status} - ${propText}`);
    }
    
    const propData = await propRes.json();
    processId = propData.data?.process?.id || propData.data?.processId || propData.data?.id;
    assert.ok(processId, "No CommercialProcess ID returned");
    console.log("  ✅ Proposal submitted.\n");

    // ---------------------------------------------------------
    // 4. AWARD SUITE
    // ---------------------------------------------------------
    console.log("▶ [AWARD] Buyer Accepting Proposal...");
    const acceptRes = await fetch(`${baseURL}/api/v2/negotiations/${processId}/accept`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${buyerToken}`
      }
    });
    assert.strictEqual(acceptRes.status, 200, `Accept failed: ${acceptRes.status}`);
    console.log("  ✅ Proposal accepted (Pending Award).");

    console.log("▶ [AWARD] Buyer Checking out Awards...");
    const checkoutRes = await fetch(`${baseURL}/api/v2/negotiations/awards/checkout`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${buyerToken}`
      },
      body: JSON.stringify({ processIds: [processId] })
    });
    if (![200, 201].includes(checkoutRes.status)) {
      const checkoutText = await checkoutRes.text();
      assert.fail(`Checkout failed: ${checkoutRes.status} - ${checkoutText}`);
    }
    console.log("  ✅ Checkout successful.\n");

    console.log("==========================================");
    console.log("   🎉 SMOKE SUITE COMPLETED (100%) 🎉 ");
    console.log("==========================================");

  } catch (err) {
    console.error("\n❌ SMOKE SUITE FAILED:");
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    console.log("\n▶ [TEARDOWN] Cleaning up isolated data...");
    if (buyerCreds) await buyerCreds.user.destroy({ force: true }).catch(() => {});
    if (sellerCreds) await sellerCreds.user.destroy({ force: true }).catch(() => {});
    await sequelize.close();
    console.log("  ✅ Teardown complete.");
  }
}

runSmokeSuite();
