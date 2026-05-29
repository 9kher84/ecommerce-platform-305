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

const app = require("../../server");
const { sequelize } = require("../../sequelize_setup");

describe("GraphQL Security", () => {
  beforeAll(async () => {
    if (app.startServer) {
      await app.startServer(false);
    }
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe("Introspection", () => {
    it("should allow introspection in development", async () => {
      const res = await request(app).post("/graphql").send({
        query: `query { __schema { types { name } } }`,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.__schema).toBeDefined();
      expect(res.body.data.__schema.types).toBeDefined();
    });
  });

  describe("Query Depth Limit", () => {
    const VALID_QUERY = `
            query ValidDepth {
                __schema {
                    types {
                        fields {
                            type {
                                fields {
                                    type {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

    const DEEP_QUERY = `
            query DeepQuery {
                __schema {
                    types {
                        fields {
                            type {
                                fields {
                                    type {
                                        fields {
                                            type {
                                                fields {
                                                    type {
                                                        fields {
                                                            type {
                                                                name
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

    it("should accept queries within depth limit (depth ~6)", async () => {
      const res = await request(app)
        .post("/graphql")
        .send({ query: VALID_QUERY });

      expect(res.statusCode).toBe(200);
      // Should have data or be successful
      expect(res.body.data || res.body.errors).toBeDefined();

      // If there are errors, they shouldn't be about depth
      if (res.body.errors) {
        const depthError = res.body.errors.find(
          (e) =>
            e.message.includes("depth") ||
            e.message.includes("exceeds maximum"),
        );
        expect(depthError).toBeUndefined();
      }
    });

    it("should REJECT queries exceeding depth limit (depth ~12)", async () => {
      const res = await request(app)
        .post("/graphql")
        .send({ query: DEEP_QUERY });

      expect(res.statusCode).toBe(400);
      expect(res.body.errors).toBeDefined();

      const depthError = res.body.errors.find(
        (e) =>
          e.message.includes("depth") ||
          e.message.includes("exceeds maximum") ||
          e.message.includes("exceeds max"),
      );

      expect(depthError).toBeDefined();
    });
  });

  describe("Query Complexity", () => {
    it("should handle simple queries", async () => {
      const res = await request(app).post("/graphql").send({
        query: `query { __typename }`,
      });

      expect(res.statusCode).toBe(200);
      expect(res.body.data).toBeDefined();
    });
  });
});
