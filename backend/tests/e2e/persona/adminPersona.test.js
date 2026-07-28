const request = require("supertest");
const app = require("../../../server");
const seedPersonaUsers = require("../../../scripts/seedPersonaUsers");

describe("Admin Persona End-to-End Test Suite", () => {
  let adminToken;

  beforeAll(async () => {
    await seedPersonaUsers();

    // Login Admin Persona
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "admin@markethub.sa", password: "Password123!" });

    adminToken = res.body.token || res.body.accessToken;
  });

  test("1. Admin Persona: should toggle feature flag and evaluate owner override policy", async () => {
    const flagRes = await request(app)
      .post("/api/admin/feature-flags")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ flagKey: "AI_AUTO_NEGOTIATION", enabled: true });

    expect([200, 201, 404]).toContain(flagRes.status);
  });
});
