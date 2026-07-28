const { PurchaseRequest, User, Category, PriceQuote } = require("../sequelize_setup");
const requestController = require("../src/modules/procurement/infrastructure/api/RequestControllerV2");
const EventBus = require('../src/shared/infrastructure/eventBus/EventBus');
const NotifySectorSellersHandler = require('../src/modules/procurement/application/handlers/NotifySectorSellersHandler');
const RequestService = require("../services/requestService");
const AuditHelper = require("../utils/AuditHelper");
const NotificationService = require("../services/notificationService");
const { appendEventLog } = require("../services/eventLogService");

// Mock dependencies to prevent actual DB writes during Golden Master creation
jest.mock("../sequelize_setup", () => {
  const original = jest.requireActual("../sequelize_setup");
  return {
    ...original,
    PurchaseRequest: {
      findByPk: jest.fn(),
      update: jest.fn().mockResolvedValue([1]),
    },
    User: {
      update: jest.fn(),
    },
    ActionLog: {
      create: jest.fn(),
    },
    PriceQuote: {
      count: jest.fn(),
    }
  };
});

jest.mock("../utils/AuditHelper", () => ({
  log: jest.fn(),
}));

jest.mock("../services/notificationService", () => ({
  sendToUser: jest.fn(),
}));

jest.mock("../services/eventLogService", () => ({
  appendEventLog: jest.fn(),
}));

// We mock notifySectorSellers to avoid real notifications, but we spy on it to ensure it was called.
RequestService.notifySectorSellers = jest.fn().mockResolvedValue(true);

describe("GOLDEN MASTER: PublishPurchaseRequest", () => {
  let mockReq, mockRes;

  beforeAll(() => {
    EventBus.subscribe("RequestPublishedEvent", NotifySectorSellersHandler);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      user: { id: "buyer-1" },
      auth: { principal: { id: "buyer-1" }, actor: { id: "buyer-1", roles: ["buyer"] } },
      body: { publishAsRFQ: false },
      params: { id: "req-123" },
      ip: "127.0.0.1",
      headers: { "user-agent": "jest-test" }
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it("BUGFIX-001: should correctly update status and persist statusHistory within a transaction", async () => {
    // 1. Arrange: Mock the DB finding a valid Draft Request
    const mockRequestInstance = {
      id: "req-123",
      userId: "buyer-1",
      status: "draft",
      version: 1,
      getDataValue: jest.fn().mockReturnValue([]),
      update: jest.fn(),
    };

    PurchaseRequest.findByPk.mockResolvedValue(mockRequestInstance);
    PriceQuote.count.mockResolvedValue(0);

    // 2. Act: Call the controller directly
    await requestController.publishRequest(mockReq, mockRes);

    // 3. EXPECT DATABASE PERSISTENCE TO INCLUDE STATUS HISTORY (BUGFIX-001)
    expect(PurchaseRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "published",
        statusHistory: expect.arrayContaining([
          expect.objectContaining({
            from: "draft",
            to: "published",
            userId: "buyer-1"
          })
        ])
      }),
      expect.objectContaining({
        where: { id: "req-123", version: 1 },
        transaction: expect.anything()
      })
    );

    // Side Effects via EventBus / Handler
    // Note: The actual EventBus logic calls the handler which calls notifySectorSellers
    // But since it's fire-and-forget, we await a tiny tick to let it process
    await new Promise(r => setTimeout(r, 50)); 
    
    // Event Log Check
    expect(appendEventLog).toHaveBeenCalledWith(expect.objectContaining({
      actionType: "status_transition",
      afterState: { status: "published" },
      entityId: "req-123"
    }), expect.objectContaining({ transaction: expect.anything() }));

    // Audit Check
    expect(AuditHelper.log).toHaveBeenCalledWith(
      expect.anything(),
      "REQUEST_STATUS_PUBLISHED",
      { type: "PurchaseRequest", id: "req-123" },
      {},
      { previousStatus: "draft", newStatus: "published", reason: null },
      expect.objectContaining({ transaction: expect.anything() })
    );

    // Side Effects
    expect(RequestService.notifySectorSellers).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "req-123",
        status: "published",
        userId: "buyer-1"
      })
    );

    // HTTP Response Check
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: expect.stringContaining("published successfully")
    }));
  });
});
