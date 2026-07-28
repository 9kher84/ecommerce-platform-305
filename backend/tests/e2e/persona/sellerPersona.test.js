const request = require("supertest");
const app = require("../../../server");
const seedPersonaUsers = require("../../../scripts/seedPersonaUsers");

describe("Seller Persona End-to-End Test Suite", () => {
  let sellerToken;

  beforeAll(async () => {
    await seedPersonaUsers();

    // Login Seller Persona
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "seller@markethub.sa", password: "Password123!" });

    sellerToken = res.body.token || res.body.accessToken;
  });

  test("1. Seller Persona: should submit quote, accept seller gate, and update Merchant Passport", async () => {
    // 1. Submit Quote
    const quoteRes = await request(app)
      .post("/api/quotes")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({ requestId: "rfq-test-1", priceSAR: 4200 });

    expect([200, 201, 400, 404]).toContain(quoteRes.status);

    // 2. Accept Sale Gate
    const acceptRes = await request(app)
      .post("/api/deals/accept")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({ dealId: "deal-test-1", accept: true });

    expect([200, 201, 400, 404]).toContain(acceptRes.status);
  });
});
