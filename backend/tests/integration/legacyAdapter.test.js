const request = require("supertest");
const app = require("../../server");
const { sequelize } = require("../../sequelize_setup");

describe("Phase 3.999.5: LegacyIntakeAdapter DTO Bug Fix", () => {
  let testUser;
  beforeAll(async () => {
    await app.startServer(false);
    process.env.ENABLE_UNIVERSAL_INTAKE = "true";
    testUser = await sequelize.models.User.create({
      name: "Legacy Test User",
      email: `legacy-${Date.now()}@test.com`,
      password: "password123",
      role: "seller"
    });
  });

  afterAll(async () => {
    if (testUser) await testUser.destroy();
    process.env.ENABLE_UNIVERSAL_INTAKE = "false";
    await sequelize.close();
  });

  it("Should properly map legacy payload to flat DTO fields and create Product with valid name/quantity", async () => {
    const timestamp = Date.now();
    const token = jwt.sign({ id: testUser.id, role: "seller" }, process.env.JWT_SECRET || "supersecret12345678901234567890123", { expiresIn: "1h" });
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Legacy Supply " + timestamp,
        quantity: 15,
        estimatedPrice: 300,
        unit: "box",
        categoryId: 1
      });
    
    // We expect it to succeed with 201
    // If it fails with 500 (notNull violation), the DTO mapping is broken.
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.adapterUsed).toBe(true);
    
    const product = await sequelize.models.Product.findByPk(res.body.product.id);
    expect(product).not.toBeNull();
    // Validate it actually received the name correctly
    expect(product.name.en).toBe("Legacy Supply " + timestamp);
    expect(product.stockLevel).toBe(15);
  });
});
