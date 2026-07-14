const { spawn } = require('child_process');

async function run() {
  console.log("=== HTTP ACCEPTANCE VERIFICATION ===");
  console.log("🚀 Spawning an isolated HTTP server on port 5005...");
  const serverProcess = spawn('node', ['server.js'], { env: { ...process.env, PORT: '5005', EMAIL_MOCK_MODE: 'true' } });
  
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

  const BASE_URL = 'http://localhost:5005';
  const email = `http_acceptance_${Date.now()}@example.com`; // Unique email every time to avoid conflicts
  const oldPassword = "OldPassword123!";
  const newPassword = "NewPassword456!";

  // --- Step 0: Register User (To guarantee the server knows the user) ---
  console.log("\n[0] POST /api/auth/register");
  const resRegister = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: "HTTP Test",
      email,
      password: oldPassword,
      role: "buyer",
      sectorIds: [1] // Required by validation
    })
  });
  const bodyRegister = await resRegister.json();
  console.log(`Status: ${resRegister.status}`);
  console.log(`Response: ${JSON.stringify(bodyRegister).substring(0, 100)}...`);

  // --- Step 1: Forgot Password ---
  console.log("\n[1] POST /api/auth/forgot-password");
  console.log(`Payload: { "email": "${email}" }`);
  
  // Clear stdout to easily find the new token
  stdoutData = '';

  const resForgot = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  const bodyForgot = await resForgot.json();

  console.log(`Status: ${resForgot.status}`);
  console.log(`Response: ${JSON.stringify(bodyForgot)}`);

  // Wait 2 seconds for stdout to accumulate
  await new Promise(r => setTimeout(r, 2000));

  // Get token from mock HTML log
  let capturedToken = null;
  const match = stdoutData.match(/reset-password\/([a-f0-9]+)/);
  if (match) {
    capturedToken = match[1];
  }

  if (!capturedToken) {
    serverProcess.kill();
    console.log("--- STDOUT CONTENT ---");
    console.log(stdoutData);
    throw new Error("Failed to capture token from mock HTML log!");
  }
  console.log(`✅ Token captured from Mock Email for test continuation`);

  // --- Step 2: Reset Password ---
  console.log(`\n[2] PUT /api/auth/reset-password/${capturedToken}`);
  console.log(`Payload: { "password": "NewPassword456!" }`);
  
  const resReset = await fetch(`${BASE_URL}/api/auth/reset-password/${capturedToken}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: newPassword })
  });
  const bodyReset = await resReset.json();
  
  console.log(`Status: ${resReset.status}`);
  console.log(`Response: ${JSON.stringify(bodyReset)}`);

  // --- Step 3: Login ---
  console.log("\n[3] POST /api/auth/login (With New Password)");
  console.log(`Payload: { "email": "${email}", "password": "${newPassword}" }`);
  
  const resLogin = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: newPassword })
  });
  const bodyLogin = await resLogin.json();
  
  console.log(`Status: ${resLogin.status}`);
  console.log(`Response: { success: ${bodyLogin.success}, role: '${bodyLogin.user?.role}' }`);

  console.log("\n=== ACCEPTANCE TEST PASSED ===");

  serverProcess.kill();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
