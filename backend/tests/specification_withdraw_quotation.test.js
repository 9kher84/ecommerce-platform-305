const { Quotation, sequelize } = require("../sequelize_setup");
const QuotationControllerV2 = require("../src/modules/procurement/infrastructure/api/QuotationControllerV2");
const EventBus = require('../src/shared/infrastructure/eventBus/EventBus');

jest.mock("../sequelize_setup", () => {
  const mTransaction = { commit: jest.fn(), rollback: jest.fn() };
  return {
    sequelize: { transaction: jest.fn().mockResolvedValue(mTransaction) },
    Quotation: { update: jest.fn(), findByPk: jest.fn() },
  };
});

describe("SPECIFICATION: WithdrawQuotation", () => {
  let mockReq, mockRes;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      user: { id: "seller-1", organization_id: "org-1" },
      params: { id: "quote-123" },
      ip: "127.0.0.1",
      headers: { "user-agent": "jest-test" }
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  it("should successfully withdraw an owned quotation without updating RFQ", async () => {
    // 1. Arrange Mocks
    Quotation.findByPk.mockResolvedValue({
      id: "quote-123",
      purchaseRequestId: "req-123",
      sellerOrganizationId: "org-1",
      status: "submitted",
      withdrawnAt: null,
      items: []
    });

    const mockPublish = jest.spyOn(EventBus, 'publish').mockImplementation(() => {});

    // 2. Act
    await QuotationControllerV2.withdrawQuotation(mockReq, mockRes);

    // 3. Assert Response
    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      quote: expect.objectContaining({
        id: "quote-123",
        status: "withdrawn",
        withdrawnAt: expect.any(Date)
      })
    }));

    // 4. Assert Persistence
    expect(Quotation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "withdrawn",
        withdrawnAt: expect.any(Date)
      }),
      expect.objectContaining({ where: { id: "quote-123" }, transaction: expect.anything() })
    );

    // 5. Assert Event Dispatched
    expect(mockPublish).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "QuotationWithdrawnEvent",
        aggregateId: "quote-123",
        payload: expect.objectContaining({
          status: "withdrawn"
        })
      })
    );
  });

  it("should fail if the seller does not own the quotation", async () => {
    // 1. Arrange Mocks
    Quotation.findByPk.mockResolvedValue({
      id: "quote-123",
      purchaseRequestId: "req-123",
      sellerOrganizationId: "org-DIFFERENT",
      status: "submitted",
      items: []
    });

    // 2. Act & Assert
    await expect(QuotationControllerV2.withdrawQuotation(mockReq, mockRes))
      .rejects.toThrow("You do not have permission to modify this quotation.");
  });
});
