const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const config = require("../config");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "E-Commerce Platform API",
      version: "2.0.0",
      description: `
                A comprehensive B2B e-commerce platform API for connecting buyers and sellers.
                
                ## Features
                - User authentication with JWT
                - Role-based access control (Buyer, Seller, Admin)
                - Purchase request management
                - Price quote system
                - Deal lifecycle management
                - Fraud detection
                - Payment integration (Ready for activation)
                - Real-time notifications via Socket.IO
                
                ## Security
                - HttpOnly cookies for tokens
                - SSRF protection
                - Rate limiting
                - Input validation
                - Device fingerprinting
                
                ## Subscription Tiers
                - **Free**: Basic features
                - **Plan A**: Advanced features for buyers/sellers
                - **Plan B**: Premium features with multiple locations
            `,
      contact: {
        name: "API Support",
        email: "support@example.com",
      },
      license: {
        name: "Proprietary",
        url: "https://example.com/license",
      },
    },
    servers: [
      {
        url: `http://localhost:${config.server.port}`,
        description: "Development server",
      },
      {
        url: "https://api.example.com",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
          description: "JWT token stored in HttpOnly cookie",
        },
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT token in Authorization header (alternative)",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: {
              type: "string",
              format: "uuid",
              description: "User unique identifier",
            },
            name: {
              type: "string",
              description: "User full name",
            },
            email: {
              type: "string",
              format: "email",
              description: "User email address",
            },
            role: {
              type: "string",
              enum: ["buyer", "seller", "admin"],
              description: "User role",
            },
            subscriptionTier: {
              type: "string",
              enum: ["free", "plan_a", "plan_b"],
              description: "Subscription tier",
            },
            isActive: {
              type: "boolean",
              description: "Account active status",
            },
          },
        },
        PurchaseRequest: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              description: "Request ID",
            },
            title: {
              type: "string",
              description: "Request title",
            },
            description: {
              type: "string",
              description: "Detailed description",
            },
            categoryId: {
              type: "integer",
              description: "Category ID",
            },
            status: {
              type: "string",
              enum: [
                "draft",
                "published",
                "in_negotiation",
                "agreed",
                "completed",
                "cancelled",
              ],
              description: "Request status",
            },
            buyerId: {
              type: "string",
              format: "uuid",
              description: "Buyer user ID",
            },
          },
        },
        PriceQuote: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              description: "Quote ID",
            },
            requestId: {
              type: "integer",
              description: "Associated request ID",
            },
            sellerId: {
              type: "string",
              format: "uuid",
              description: "Seller user ID",
            },
            priceType: {
              type: "string",
              enum: ["fixed", "range", "negotiable"],
              description: "Price type",
            },
            fixedPrice: {
              type: "number",
              description: "Fixed price (if applicable)",
            },
            status: {
              type: "string",
              enum: ["pending", "accepted", "rejected", "withdrawn"],
              description: "Quote status",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            error: {
              type: "object",
              properties: {
                code: {
                  type: "string",
                  description: "Error code",
                },
                message: {
                  type: "string",
                  description: "Error message",
                },
                details: {
                  type: "object",
                  description: "Additional error details",
                },
              },
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: "Authentication required",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
              example: {
                success: false,
                error: {
                  code: "AUTH_REQUIRED",
                  message: "Authentication required to access this resource",
                },
              },
            },
          },
        },
        ForbiddenError: {
          description: "Access forbidden",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
        NotFoundError: {
          description: "Resource not found",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
        ValidationError: {
          description: "Validation error",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/Error",
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: "Authentication",
        description: "User authentication and authorization",
      },
      {
        name: "Users",
        description: "User management",
      },
      {
        name: "Requests",
        description: "Purchase request operations",
      },
      {
        name: "Quotes",
        description: "Price quote operations",
      },
      {
        name: "Deals",
        description: "Deal lifecycle management",
      },
      {
        name: "Categories",
        description: "Product categories",
      },
      {
        name: "Admin",
        description: "Administrative operations",
      },
      {
        name: "Health",
        description: "System health and monitoring",
      },
    ],
  },
  apis: ["./routes/*.js", "./controllers/*.js", "./models/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec,
};
