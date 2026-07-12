const request = require("supertest");
const app = require("../server"); // Import express app
const { sequelize } = require("../sequelize_setup");

describe("Phase 3: Intake API Integration Tests", () => {
  beforeAll(async () => {
    // Sync or authenticate DB if necessary
    await app.startServer(false);
  });

  let token;
  let testUser;
  afterAll(async () => {
    // Close DB connection after tests
    await sequelize.close();
  });

  beforeEach(async () => {
    testUser = await sequelize.models.User.create({
      name: "API Test User",
      email: `api-${Date.now()}@test.com`,
      password: "password123",
      role: "seller"
    });
    token = require("jsonwebtoken").sign({ id: testUser.id, role: "seller" }, process.env.JWT_SECRET || "supersecret12345678901234567890123", { expiresIn: "1h" });
  });

  afterEach(async () => {
    if (testUser) await testUser.destroy();
  });

  describe("Scenario 1: Supply (Create Product)", () => {
    let dtoPayload;

    it("should analyze supply text and return a valid DTO", async () => {
      const res = await request(app)
        .post("/api/intake/analyze")
        .set("Authorization", `Bearer ${token}`)
        .send({ text: "يوجد 100 حبة لاب توب للبيع بسعر 2500" });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.opportunity.type).toBe("SUPPLY");
      expect(res.body.opportunity.price).toBe(2500);
      
      dtoPayload = res.body.opportunity;
    });

    it("should create a Product using the validated DTO", async () => {
      const res = await request(app)
        .post("/api/intake/create")
        .set("Authorization", `Bearer ${token}`)
        .send({
          opportunity: dtoPayload,
          categoryId: 1 // Assuming 1 is a valid category ID for tests
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBeDefined();
      expect(parseFloat(res.body.data.estimatedPrice)).toBe(2500);
      expect(res.body.data.stockLevel).toBe(100);
      // Clean up created record if necessary
      await sequelize.models.Product.destroy({ where: { id: res.body.data.id } });
    });
  });

  describe("Scenario 2: Demand (Create PurchaseRequest)", () => {
    let dtoPayload;

    it("should analyze demand text and return a valid DTO", async () => {
      const res = await request(app)
        .post("/api/intake/analyze")
        .set("Authorization", `Bearer ${token}`)
        .send({ text: "مطلوب 50 طن حديد تسليح" });

      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.opportunity.type).toBe("DEMAND");
      
      dtoPayload = res.body.opportunity;
    });

    it("should create a PurchaseRequest using the validated DTO", async () => {
      const res = await request(app)
        .post("/api/intake/create")
        .set("Authorization", `Bearer ${token}`)
        .send({
          opportunity: dtoPayload,
          categoryId: 1
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.title).toContain("حديد تسليح");
      
      // Clean up
      await sequelize.models.PurchaseRequest.destroy({ where: { id: res.body.data.id } });
    });
  });

  describe("Scenario 3: Validation Error", () => {
    it("should fail validation and return 400 for empty or unparseable text", async () => {
      const res = await request(app)
        .post("/api/intake/analyze")
        .set("Authorization", `Bearer ${token}`)
        .send({ text: "نص غير واضح بدون نوع او تفاصيل" });

      // Because type is missing, syntax validator will fail it
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe("Validation failed");
      expect(res.body.errors.length).toBeGreaterThan(0);
    });
  });
});
