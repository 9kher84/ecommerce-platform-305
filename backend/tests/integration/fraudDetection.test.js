const request = require("supertest");

// Mocks
jest.mock("uuid", () => ({
  v4: () => "test-uuid-" + Math.random().toString(36).substr(2, 9),
}));

jest.mock("ioredis", () => {
  return jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    connect: jest.fn().mockResolvedValue(),
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue("OK"),
    publish: jest.fn(),
    subscribe: jest.fn(),
    quit: jest.fn().mockResolvedValue(),
    disconnect: jest.fn(),
  }));
});

const app = require("../../server"); // Imports app and startServer
const { sequelize } = require("../../sequelize_setup");

describe("Fraud Detection Integration", () => {
  let buyerCookies;
  let sellerCookies;
  let requestId;

  // Use a fresh user for this test suite to avoid rate limits
  const buyerEmail = `fraud_buyer_${Date.now()}@jest.com`;
  const buyerPassword = "password123";

  // Existing seller
  const sellerEmail = "owner@test.com";
  const sellerPassword = "123456";

  const buyerFingerprint = "DEVICE-UNIQUE-BUYER-JEST";

  beforeAll(async () => {
    // Initialize DB and App without listening on port
    if (app.startServer) {
      await app.startServer(false);
    }
  });

  afterAll(async () => {
    await sequelize.close(); // Close DB connection
  });

  it("should register a new buyer", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Fraud Jest Buyer",
      email: buyerEmail,
      password: buyerPassword,
      role: "buyer",
    });

    // 201 Created or 400 (if exists - unlikely with timestamp)
    expect(res.statusCode).toBe(201);
    expect(res.headers["set-cookie"]).toBeDefined();
    buyerCookies = res.headers["set-cookie"];
  });

  it("should create a request with device fingerprint", async () => {
    const res = await request(app)
      .post("/api/requests")
      .set("Cookie", buyerCookies)
      .set("x-device-fingerprint", buyerFingerprint)
      .send({
        title: "Jest Fraud Test Request",
        description: "Testing fraud detection integration",
        categoryId: 1,
      });

    if (res.statusCode !== 201) {
      console.error("Create Request Failed:", res.body);
    }
    expect(res.statusCode).toBe(201);
    requestId = res.body.request.id;
  });

  it("should publish the request", async () => {
    const res = await request(app)
      .post(`/api/requests/${requestId}/publish`)
      .set("Cookie", buyerCookies);

    expect(res.statusCode).toBe(200);
  });

  it("should login as seller", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: sellerEmail,
      password: sellerPassword,
    });

    expect(res.statusCode).toBe(200);
    sellerCookies = res.headers["set-cookie"];
  });

  it("should allow quote from different device", async () => {
    const res = await request(app)
      .post(`/api/requests/${requestId}/quotes`)
      .set("Cookie", sellerCookies)
      .set("x-device-fingerprint", "DEVICE-DIFFERENT-SELLER")
      .send({
        priceType: "fixed",
        fixedPrice: 50,
      });

    expect(res.statusCode).toBe(201);
  });

  it("should REJECT quote from SAME device (Self-Trading)", async () => {
    const res = await request(app)
      .post(`/api/requests/${requestId}/quotes`)
      .set("Cookie", sellerCookies)
      .set("x-device-fingerprint", buyerFingerprint) // Same as buyer
      .send({
        priceType: "fixed",
        fixedPrice: 45,
      });

    // Should return 403 (Forbidden) or 500 (if fraud detection throws error)
    expect(res.statusCode).toBeGreaterThanOrEqual(400);
    expect(res.body.success).toBeFalsy();
    // Verify it's an error response
    expect(res.body.error || res.body.message).toBeDefined();
  });
});
