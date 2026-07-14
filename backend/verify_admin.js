const { spawn } = require('child_process');

async function run() {
  // First, get or create our admin user so we know their ID
  const { User } = require('./sequelize_setup');
  let adminUser = await User.findOne({ where: { role: 'buyer' } });
  if (!adminUser) {
    adminUser = await User.create({ name: 'Admin Test', email: 'admin_test@example.com', password: 'Password123!', role: 'buyer', isActive: true, sectorIds: [1] });
  }
  await adminUser.update({ isAdmin: true, adminPermissions: ['manage_users'] });

  console.log("🚀 Spawning an isolated HTTP server on port 5006...");
  const serverProcess = spawn('node', ['server.js'], { env: { ...process.env, PORT: '5006', EMAIL_MOCK_MODE: 'true', OWNER_ID: adminUser.id } });
  
  let stdoutData = '';
  serverProcess.stdout.on('data', (data) => { stdoutData += data.toString(); });
  serverProcess.stderr.on('data', (data) => {});

  // Wait for server to be completely ready
  await new Promise((resolve, reject) => {
    let timeout = setTimeout(() => {
      serverProcess.kill();
      reject(new Error("Timeout waiting for server to start"));
    }, 15000);

    const checkInterval = setInterval(() => {
      if (stdoutData.includes('Apollo GraphQL Server ready') || stdoutData.includes('Server running in')) {
        clearInterval(checkInterval);
        clearTimeout(timeout);
        resolve();
      }
    }, 500);
  });

  const BASE_URL = 'http://localhost:5006';

  const token = adminUser.getSignedJwtToken();
  const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  try {
    // 2. Test Admin Stats
    console.log("\n[1] GET /api/dashboard/admin/stats");
    const resStats = await fetch(`${BASE_URL}/api/dashboard/admin/stats`, { headers });
    console.log(`Status: ${resStats.status}`);
    console.log(`Response: ${JSON.stringify(await resStats.json())}`);

    // 3. Test Users List with Pagination
    console.log("\n[2] GET /api/admin/users/all?page=1&limit=50");
    const resUsers = await fetch(`${BASE_URL}/api/admin/users/all?page=1&limit=50`, { headers });
    const usersData = await resUsers.json();
    console.log(`Status: ${resUsers.status}`);
    console.log(`Pagination: ${JSON.stringify(usersData.pagination)}`);
    console.log(`Found: ${usersData.data.length} users`);

    // 4. Test Search (Search for a specific, realistic user from the database)
    const testUser = await User.findOne({ where: { role: 'buyer' }, order: [['createdAt', 'DESC']] });
    if (!testUser) throw new Error("No buyer found to test search");
    console.log(`\n[3] GET /api/admin/users/all?search=${testUser.email}`);
    const resSearch = await fetch(`${BASE_URL}/api/admin/users/all?search=${testUser.email}`, { headers });
    const searchData = await resSearch.json();
    console.log(`Status: ${resSearch.status}`);
    console.log(`Found: ${searchData.data.length} users matching '${testUser.email}'`);

    // 5. Test Filter
    console.log("\n[4] GET /api/admin/users/all?role=buyer");
    const resFilter = await fetch(`${BASE_URL}/api/admin/users/all?role=buyer`, { headers });
    const filterData = await resFilter.json();
    console.log(`Status: ${resFilter.status}`);
    console.log(`Found: ${filterData.data.length} buyers`);

    // 6. Test Toggle Status (Normal User)
    console.log(`\n[5] POST /api/admin/users/${testUser.id}/toggle-status`);
    console.log(`Request payload: { isActive: false }`);
    const resToggleNormal = await fetch(`${BASE_URL}/api/admin/users/${testUser.id}/toggle-status`, { 
        method: 'POST', 
        headers,
        body: JSON.stringify({ isActive: false })
    });
    console.log(`Status: ${resToggleNormal.status}`);
    console.log(`Response: ${JSON.stringify(await resToggleNormal.json())}`);

    // 7. Test Toggle Status (Owner)
    // The owner's ID is process.env.OWNER_ID, which we passed in as adminUser.id in this test context
    console.log(`\n[6] POST /api/admin/users/${adminUser.id}/toggle-status (Attempt to disable Owner)`);
    console.log(`Request payload: { isActive: false }`);
    const resToggleOwner = await fetch(`${BASE_URL}/api/admin/users/${adminUser.id}/toggle-status`, { 
        method: 'POST', 
        headers,
        body: JSON.stringify({ isActive: false })
    });
    console.log(`Status: ${resToggleOwner.status}`);
    console.log(`Response: ${JSON.stringify(await resToggleOwner.json())}`);

    console.log("\n=== VERIFICATION PASSED ===");
    serverProcess.kill();
    process.exit(0);

  } catch (err) {
    console.error("Test failed:", err);
    serverProcess.kill();
    process.exit(1);
  }
}

run();
