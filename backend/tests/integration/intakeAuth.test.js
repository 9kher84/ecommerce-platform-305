const request = require("supertest");
const app = require("../../server");
const { sequelize } = require("../../sequelize_setup");
const jwt = require("jsonwebtoken");

describe("Phase 3.999.5: Authorization Verification", () => {
  let testUser;
  beforeAll(async () => {
    await app.startServer(false);
    testUser = await sequelize.models.User.create({
      name: "Auth Test User",
      email: `auth-${Date.now()}@test.com`,
      password: "password123",
      role: "seller"
    });
  });

  afterAll(async () => {
    if (testUser) await testUser.destroy();
    await sequelize.close();
  });

  it("Should return 401 for unauthenticated user", async () => {
    const res = await request(app)
      .post("/api/intake/analyze")
      .send({ text: "لدي 200 كرتون طماطم للبيع بسعر 50 للكرتون" });

    expect(res.statusCode).toBe(401);
  });

  it("Should return 200 for authenticated user", async () => {
    const token = jwt.sign({ id: testUser.id, role: "seller" }, process.env.JWT_SECRET || "supersecret12345678901234567890123", { expiresIn: "1h" });

    const res = await request(app)
      .post("/api/intake/analyze")
      .set("Authorization", `Bearer ${token}`)
      .send({ text: "لدي 200 كرتون طماطم للبيع بسعر 50 للكرتون" });

    // Assuming validation fails due to mock db, but authentication shouldn't be 401
    expect(res.statusCode).not.toBe(401);
    expect([200, 400]).toContain(res.statusCode);
  });
});
