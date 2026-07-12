process.env.DISABLE_RATE_LIMIT = "true";
process.env.NODE_ENV = "test";
const autocannon = require("autocannon");
const app = require("../server");
const fs = require("fs");
const path = require("path");

let globalTestUserId;

async function runLoadTests() {
  const server = await app.startServer(true);
  const { sequelize } = require("../sequelize_setup");
  const testUser = await sequelize.models.User.create({
    name: "Load Test User",
    email: `load-${Date.now()}@test.com`,
    password: "password123",
    role: "seller"
  });
  globalTestUserId = testUser.id;
  
  const PORT = process.env.PORT || 5000;
  const url = `http://localhost:${PORT}/api/intake/create`;
  
  const results = {};
  
  // Verify payload works before load test
  for (let i = 0; i < 5; i++) {
    const verifyRes = await fetch(url, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${require("jsonwebtoken").sign({ id: globalTestUserId, role: "seller" }, process.env.JWT_SECRET || "supersecret12345678901234567890123", { expiresIn: "1h" })}`,
        "X-Idempotency-Key": `verify-${Date.now()}-${i}`
      },
      body: JSON.stringify({ 
        opportunity: { type: "SUPPLY", name: "Load Test Supply", quantity: 200, price: 50, unit: "box" }, categoryId: 1 
      })
    });
    console.log(`Verify ${i} status:`, verifyRes.status, "body:", await verifyRes.text());
  }
  
  const runTest = (amount) => {
    return new Promise((resolve, reject) => {
      console.log(`Starting Load Test: ${amount} requests`);
      const token = require("jsonwebtoken").sign({ id: globalTestUserId, role: "seller" }, process.env.JWT_SECRET || "supersecret12345678901234567890123", { expiresIn: "1h" });
      const instance = autocannon({
        url,
        connections: 10, // Concurrent connections
        amount: amount,   // Total number of requests
        setupClient: (client) => {
          client.setHeaders({
            "Content-type": "application/json",
            "Authorization": `Bearer ${token}`,
            "X-Idempotency-Key": `load-test-${Date.now()}-${Math.random()}`
          });
        },
        requests: [
          {
            method: 'POST',
            body: JSON.stringify({ 
              opportunity: { type: 'SUPPLY', name: 'Load Test Supply', quantity: 200, price: 50, unit: 'box' },
              categoryId: 1 
            })
          }
        ]
      }, (err, result) => {
        if (err) {
          console.error(err);
          return reject(err);
        }
        
        results[`req_${amount}`] = {
          requests: amount,
          averageLatencyMs: result.latency.average,
          p95LatencyMs: result.latency.p95,
          p99LatencyMs: result.latency.p99,
          maxLatencyMs: result.latency.max,
          errorRate: (result.errors / amount) * 100,
          throughputReqSec: result.requests.average
        };
        console.log(`Finished ${amount} requests`);
          console.log(`\n--- Status Codes Breakdown ---`);
          console.log(`2xx: ${result.statusCodeStats['2']?.count || result.statusCodeStats['201']?.count || result.statusCodeStats['200']?.count || 0}`);
          console.log(`3xx: ${result.statusCodeStats['3']?.count || 0}`);
          console.log(`4xx: ${result.statusCodeStats['4']?.count || result.statusCodeStats['401']?.count || result.statusCodeStats['403']?.count || result.statusCodeStats['400']?.count || 0}`);
          console.log(`5xx: ${result.statusCodeStats['5']?.count || result.statusCodeStats['500']?.count || 0}`);
          console.log(`Errors: ${result.errors || 0}`);
          console.log(`Timeouts: ${result.timeouts || 0}`);
          console.log(`Req/sec: ${result.requests.average}`);
          console.log(`------------------------------\n`);
          resolve(result);
      });
      
      autocannon.track(instance, { renderProgressBar: false });
    });
  };

  try {
    results['10'] = await runTest(10);
    results['50'] = await runTest(50);
    results['100'] = await runTest(100);
    
    fs.writeFileSync(
      path.join(__dirname, "load_results.json"), 
      JSON.stringify(results, null, 2)
    );
    console.log("Load tests completed. Results saved to load_results.json");
    await testUser.destroy();
  } catch (err) {
    console.error("Load test failed", err);
  } finally {
    process.exit(0);
  }
}

runLoadTests();
