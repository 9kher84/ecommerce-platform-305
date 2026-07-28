const Quotation = require('../../src/modules/procurement/domain/entities/Quotation');
const DomainViolationException = require('../../src/modules/procurement/domain/exceptions/DomainViolationException');

describe('Quotation Aggregate Root Unit Tests (Sprint 3 Verification)', () => {
  const validRfq = {
    id: 'rfq-100',
    status: 'rfq_published',
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
    items: [{ id: 'pri-1', quantity: 10 }]
  };

  const validItems = [
    {
      purchaseRequestItemId: 'pri-1',
      unitPrice: 100,
      quantityOffered: 10,
      vatRate: 0.15,
      discount: 10
    }
  ];

  test('should throw exception if submitting quote without items', () => {
    const quote = new Quotation({
      id: 'quote-1',
      purchaseRequestId: 'rfq-100',
      sellerOrganizationId: 'seller-org-1',
      items: []
    });

    expect(() => {
      quote.submit(validRfq, []);
    }).toThrow(DomainViolationException);
  });

  test('should successfully calculate totals and submit valid quotation', () => {
    const quote = new Quotation({
      id: 'quote-1',
      purchaseRequestId: 'rfq-100',
      sellerOrganizationId: 'seller-org-1',
      items: validItems
    });

    quote.calculateTotals();
    expect(quote.subtotal).toBe(1000);
    expect(quote.discountAmount).toBe(10);
    expect(quote.grandTotal).toBeGreaterThan(0);

    quote.submit(validRfq, []);
    expect(quote.status).toBe('submitted');
    expect(quote._domainEvents.length).toBe(1);
  });

  test('should prevent duplicate active quote per seller for same RFQ', () => {
    const quote = new Quotation({
      id: 'quote-2',
      purchaseRequestId: 'rfq-100',
      sellerOrganizationId: 'seller-org-1',
      items: validItems
    });

    const existingQuotes = [
      { id: 'quote-1', status: 'submitted' }
    ];

    expect(() => {
      quote.submit(validRfq, existingQuotes);
    }).toThrow(DomainViolationException);
  });

  test('should throw exception on invalid transition from accepted state', () => {
    const quote = new Quotation({
      id: 'quote-3',
      purchaseRequestId: 'rfq-100',
      sellerOrganizationId: 'seller-org-1',
      status: 'accepted',
      items: validItems
    });

    expect(() => {
      quote.submit(validRfq, []);
    }).toThrow(DomainViolationException);
  });
});
