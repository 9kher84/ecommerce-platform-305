const PurchaseRequest = require('../../src/modules/procurement/domain/entities/PurchaseRequest');
const DomainViolationException = require('../../src/modules/procurement/domain/exceptions/DomainViolationException');

describe('PurchaseRequest Aggregate Root Unit Tests (Sprint 1 Verification)', () => {
  const mockAuth = {
    actorId: 'buyer-user-123',
    actorRole: 'buyer'
  };

  const validItems = [
    {
      title: 'حديد تسليح 12 مم',
      quantity: 50,
      unit: 'طن',
      targetPrice: 2800
    }
  ];

  test('should throw DomainViolationException if created without items', () => {
    expect(() => {
      PurchaseRequest.create({ title: 'طلب بدون بنود' }, [], [], mockAuth);
    }).toThrow(DomainViolationException);
  });

  test('should successfully instantiate PurchaseRequest aggregate in draft state', () => {
    const pr = PurchaseRequest.create(
      {
        title: 'توريد حديد بناء مشروع المدرسة',
        description: 'حديد تسليح عالي الجودة مطابق للمواصفات',
        sectorId: 'construction'
      },
      validItems,
      [],
      mockAuth
    );

    expect(pr.id).toBeDefined();
    expect(pr.status).toBe('draft');
    expect(pr.items.length).toBe(1);
    expect(pr.statusHistory.length).toBe(1);
    expect(pr._domainEvents.length).toBe(1);
  });

  test('should publish RFQ and transition status correctly', () => {
    const pr = PurchaseRequest.create(
      { title: 'منافسة أسمنت' },
      validItems,
      [],
      mockAuth
    );

    const result = pr.publish(true, mockAuth);

    expect(result.newStatus).toBe('rfq_published');
    expect(pr.status).toBe('rfq_published');
    expect(pr.rfqStatus).toBe('rfq_published');
    expect(pr._domainEvents.length).toBe(2); // RequestCreated + RequestPublished
  });

  test('should allow valid award() transition and set awardedQuoteId', () => {
    const pr = PurchaseRequest.create(
      { title: 'منافسة بناء مجمع' },
      validItems,
      [],
      mockAuth
    );

    pr.publish(true, mockAuth);
    const awardResult = pr.award('quote-winner-99', mockAuth);

    expect(awardResult.newStatus).toBe('accepted');
    expect(pr.status).toBe('accepted');
    expect(pr.rfqStatus).toBe('awarded');
    expect(pr.awardedQuoteId).toBe('quote-winner-99');
  });

  test('should allow valid cancel() transition from published state', () => {
    const pr = PurchaseRequest.create(
      { title: 'طلب ملغي' },
      validItems,
      [],
      mockAuth
    );

    pr.publish(true, mockAuth);
    const cancelResult = pr.cancel('تغيير متطلبات المشروع', mockAuth);

    expect(cancelResult.newStatus).toBe('cancelled');
    expect(pr.status).toBe('cancelled');
  });

  test('should throw exception when trying to cancel an already cancelled request', () => {
    const pr = PurchaseRequest.create(
      { title: 'طلب ملغي مكرر' },
      validItems,
      [],
      mockAuth
    );

    pr.cancel('إلغاء أولي', mockAuth);

    expect(() => {
      pr.cancel('إلغاء ثاني غير مسموح', mockAuth);
    }).toThrow(DomainViolationException);
  });

  test('should throw exception on invalid status transition from draft to completed', () => {
    const pr = PurchaseRequest.create(
      { title: 'منافسة غير شرعية' },
      validItems,
      [],
      mockAuth
    );

    expect(() => {
      pr.status = 'completed';
      pr.publish(true, { actorId: 'seller-99', actorRole: 'seller' });
    }).toThrow(DomainViolationException);
  });
});
