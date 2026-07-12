const request = require("supertest");
const app = require("../server");
const { sequelize } = require("../sequelize_setup");
const fs = require("fs");
const path = require("path");

async function runSmokeTest() {
  const server = await app.startServer(false);
  const { sequelize } = require("../sequelize_setup");
  const testUser = await sequelize.models.User.create({
    name: "Smoke Test User",
    email: `smoke-${Date.now()}@test.com`,
    password: "password123",
    role: "seller"
  });

  const jwt = require("jsonwebtoken");
  const token = jwt.sign({ id: testUser.id, role: "seller" }, process.env.JWT_SECRET || "supersecret12345678901234567890123", { expiresIn: "1h" });

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
  console.log("=== STARTING PRODUCTION SMOKE TEST ===");

  await sequelize.models.Category.findOrCreate({
    where: { id: 1 },
    defaults: { name: "Test Category", name_ar: "Test", name_en: "Test", isActive: true, type: "SECTOR" }
  });

  const timestamp = Date.now();
  const results = { supply: null, demand: null, db_verification: null };
  
  // 1. SUPPLY SMOKE TEST
  try {
    const supplyRes = await request(app)
      .post("/api/intake/create")
      .set("Authorization", `Bearer ${token}`)
      .send({
        opportunity: {
          type: "SUPPLY",
          name: "Smoke Test Supply " + timestamp,
          quantity: 50,
          price: 100,
          unit: "box"
        },
        categoryId: 1
      });
    
    results.supply = { status: supplyRes.statusCode, success: supplyRes.body.success, id: supplyRes.body.data?.id };
    console.log("Supply Response:", results.supply);
  } catch (e) {
    results.supply = { error: e.message };
  }

  // 2. DEMAND SMOKE TEST
  try {
    const demandRes = await request(app)
      .post("/api/intake/create")
      .set("Authorization", `Bearer ${token}`)
      .send({
        opportunity: {
          type: "DEMAND",
          name: "Smoke Test Demand " + timestamp,
          quantity: 20,
          price: 150,
          unit: "ton"
        },
        categoryId: 1
      });
    
    results.demand = { status: demandRes.statusCode, success: demandRes.body.success, id: demandRes.body.data?.id };
    console.log("Demand Response:", results.demand);
  } catch (e) {
    results.demand = { error: e.message };
  }

  // 3. DB VERIFICATION
  const productExists = results.supply.id ? await sequelize.models.Product.findByPk(results.supply.id) : null;
  const verifySupply = results.supply.id ? await sequelize.models.Product.findByPk(results.supply.id) : null;
  const verifyDemand = results.demand.id ? await sequelize.models.PurchaseRequest.findByPk(results.demand.id) : null;
  results.db_verification = { 
    supplyInserted: !!verifySupply, 
    demandInserted: !!verifyDemand 
  };
  
  console.log("DB Verification:", { supplyInserted: !!verifySupply, demandInserted: !!verifyDemand });

  // Cleanup test user
  await testUser.destroy();


  // Output to JSON for easy parsing by the report generator
  fs.writeFileSync(path.join(__dirname, "smoke_results.json"), JSON.stringify(results, null, 2));

  process.exit(0);
}

runSmokeTest();
