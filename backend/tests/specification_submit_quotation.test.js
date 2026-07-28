const { Quotation, QuotationItem, PurchaseRequest, PurchaseRequestItem, sequelize } = require("../sequelize_setup");
const QuotationControllerV2 = require("../src/modules/procurement/infrastructure/api/QuotationControllerV2");
const EventBus = require('../src/shared/infrastructure/eventBus/EventBus');
const UpdateRfqStatusOnQuoteHandler = require('../src/modules/procurement/application/handlers/UpdateRfqStatusOnQuoteHandler');

jest.mock("../sequelize_setup", () => {
  const mTransaction = { commit: jest.fn(), rollback: jest.fn() };
  return {
    sequelize: { transaction: jest.fn().mockResolvedValue(mTransaction) },
    Quotation: { create: jest.fn(), findAll: jest.fn() },
    QuotationItem: { bulkCreate: jest.fn() },
    PurchaseRequest: { findByPk: jest.fn(), update: jest.fn() },
    PurchaseRequestItem: { update: jest.fn() }
  };
});

describe("SPECIFICATION: SubmitQuotation", () => {
  let mockReq, mockRes;

  beforeAll(() => {
    EventBus.subscribe("QuotationSubmittedEvent", UpdateRfqStatusOnQuoteHandler);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      user: { id: "seller-1", organization_id: "org-1" },
      params: { id: "req-123" },
      body: {
        items: [
          {
            purchaseRequestItemId: "item-1",
            unitPrice: 100,
            quantityOffered: 10,
            discount: 50,
            taxRate: 15
          }
        ]
      },
      ip: "127.0.0.1",
      headers: { "user-agent": "jest-test" }
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
  });

  it("should create a quotation, calculate totals, and update RFQ status in a separate transaction", async () => {
    // 1. Arrange Mocks
    PurchaseRequest.findByPk.mockResolvedValue({
      id: "req-123",
      status: "published",
      items: [
        { id: "item-1", quantity: 10, unit: "PCS", status: "pending" }
      ]
    });

    Quotation.findAll.mockResolvedValue([]); // No existing active quotes
    Quotation.create.mockResolvedValue({ id: "quote-999" });
    QuotationItem.bulkCreate.mockResolvedValue([{ id: "q-item-1" }]);

    // 2. Act
    await QuotationControllerV2.submitQuotation(mockReq, mockRes);

    // 3. Assert Response
    expect(mockRes.status).toHaveBeenCalledWith(201);
    expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      quote: expect.objectContaining({
        id: "quote-999",
        status: "submitted",
        subtotal: 1000,
        discountAmount: 50,
        taxAmount: 142.5, // (1000 - 50) * 0.15
        grandTotal: 1092.5
      })
    }));

    // 4. Assert Persistence (Transaction 1: Quotation Creation)
    expect(Quotation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        purchaseRequestId: "req-123",
        sellerOrganizationId: "org-1",
        status: "submitted",
        subtotal: 1000,
        discountAmount: 50,
        taxAmount: 142.5,
        grandTotal: 1092.5
      }),
      expect.objectContaining({ transaction: expect.anything() })
    );

    // Let the async EventBus Handler finish
    await new Promise(r => setTimeout(r, 50));

    // 5. Assert Cross-Aggregate Mutation (Transaction 2: Purchase Request Status)
    // The handler should fetch the RFQ again
    expect(PurchaseRequest.findByPk).toHaveBeenCalledTimes(2); 

    // Update Request
    expect(PurchaseRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "quoting" }),
      expect.objectContaining({ where: { id: "req-123" }, transaction: expect.anything() })
    );

    // Update Items
    expect(PurchaseRequestItem.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "quoted" }),
      expect.objectContaining({ transaction: expect.anything() })
    );
  });
});
