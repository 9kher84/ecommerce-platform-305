const http = require("http");
const jwt = require("jsonwebtoken");
const app = require("./server");

const token = jwt.sign({ id: "123e4567-e89b-12d3-a456-426614174000", role: "seller" }, process.env.JWT_SECRET || "supersecret12345678901234567890123", { expiresIn: "1h" });

const makeRequest = (headers) => {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: "localhost",
      port: 5000,
      path: "/api/intake/create",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    });
    req.on("error", (e) => resolve("Error: " + e.message));
    req.write(JSON.stringify({
      opportunity: { type: "SUPPLY", description: "Test", quantity: 10, unit: "kg" },
      categoryId: 1
    }));
    req.end();
  });
};

(async () => {
  process.env.NODE_ENV = "test";
  const server = await app.startServer(true);
  const { sequelize } = require("./sequelize_setup");
  const testUser = await sequelize.models.User.create({ id: "123e4567-e89b-12d3-a456-426614174000", name: "Auth Test", email: "auth@test.com", password: "password", role: "seller" });
  const statusWithoutJwt = await makeRequest({});
  const statusWithJwt = await makeRequest({ "Authorization": `Bearer ${token}` });

  console.log(`\n--- Request WITHOUT JWT ---`);
  console.log(`Status Code: ${statusWithoutJwt.statusCode}`);
  console.log(`Headers: ${JSON.stringify(statusWithoutJwt.headers)}`);
  console.log(`Body: ${statusWithoutJwt.body}`);
  
  console.log(`\n--- Request WITH JWT ---`);
  console.log(`Status Code: ${statusWithJwt.statusCode}`);
  console.log(`Headers: ${JSON.stringify(statusWithJwt.headers)}`);
  console.log(`Body: ${statusWithJwt.body}`);
  process.exit(0);
})();
