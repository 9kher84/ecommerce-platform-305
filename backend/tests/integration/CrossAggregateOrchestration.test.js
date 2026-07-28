const PurchaseRequest = require('../../src/modules/procurement/domain/entities/PurchaseRequest');
const Quotation = require('../../src/modules/procurement/domain/entities/Quotation');
const DealStateMachine = require('../../services/dealStateMachine');

describe('Sprint 6: Cross-Aggregate Orchestration & End-to-End Golden Path', () => {
  const buyerAuth = { actorId: 'buyer-user-1', actorRole: 'buyer' };
  const sellerAuth = { actorId: 'seller-user-1', actorRole: 'seller' };

  test('should orchestrate complete B2B commercial workflow across RFQ -> Quote -> Deal -> Invoice', () => {
    // Step 1: Buyer Creates PurchaseRequest (RFQ Aggregate)
    const rfq = PurchaseRequest.create(
      { title: 'ملاحظة توريد حديد بناء مجمع سكني', sectorId: 'construction' },
      [{ title: 'حديد 12 مم', quantity: 100, unit: 'طن', targetPrice: 2800 }],
      [],
      buyerAuth
    );
    expect(rfq.status).toBe('draft');

    // Step 2: Buyer Publishes RFQ
    rfq.publish(true, buyerAuth);
    expect(rfq.status).toBe('rfq_published');

    // Step 3: Seller Submits Quote (Quotation Aggregate)
    const quote = new Quotation({
      id: 'quote-golden-1',
      purchaseRequestId: rfq.id,
      sellerOrganizationId: 'seller-org-100',
      items: [{ purchaseRequestItemId: rfq.items[0].id, unitPrice: 2750, quantityOffered: 100 }]
    });

    quote.calculateTotals();
    expect(quote.subtotal).toBe(275000);

    quote.submit({ id: rfq.id, status: rfq.status, items: rfq.items }, []);
    expect(quote.status).toBe('submitted');

    // Step 4: Buyer Awards RFQ to Quote (Decoupled Orchestration)
    rfq.award(quote.id, buyerAuth);
    expect(rfq.status).toBe('accepted');
    expect(rfq.rfqStatus).toBe('awarded');
    expect(rfq.awardedQuoteId).toBe(quote.id);

    // Step 5: Deal & Execution State Machine (Execution Aggregate)
    const states = DealStateMachine.STATES;
    
    // Primary Selected -> Supplier Accepts -> Invoice Issued
    let dealTrans = DealStateMachine.transition(states.PRIMARY_SELECTED, states.WAITING_SUPPLIER_CONFIRMATION);
    expect(dealTrans.isValid).toBe(true);

    dealTrans = DealStateMachine.transition(states.WAITING_SUPPLIER_CONFIRMATION, states.SUPPLIER_ACCEPTED);
    expect(dealTrans.isValid).toBe(true);

    dealTrans = DealStateMachine.transition(states.SUPPLIER_ACCEPTED, states.INVOICE_CREATED);
    expect(dealTrans.isValid).toBe(true);

    // Shipping & Delivery Execution
    dealTrans = DealStateMachine.transition(states.INVOICE_CREATED, states.PREPARING_ORDER);
    expect(dealTrans.isValid).toBe(true);

    dealTrans = DealStateMachine.transition(states.PREPARING_ORDER, states.SHIPPED);
    expect(dealTrans.isValid).toBe(true);

    dealTrans = DealStateMachine.transition(states.SHIPPED, states.DELIVERED);
    expect(dealTrans.isValid).toBe(true);

    dealTrans = DealStateMachine.transition(states.DELIVERED, states.BUYER_CONFIRMED);
    expect(dealTrans.isValid).toBe(true);

    // Step 6: Invoice & Settlement (Finance Aggregate)
    dealTrans = DealStateMachine.transition(states.BUYER_CONFIRMED, states.COMMISSION_PENDING);
    expect(dealTrans.isValid).toBe(true);

    dealTrans = DealStateMachine.transition(states.COMMISSION_PENDING, states.COMMISSION_PAID);
    expect(dealTrans.isValid).toBe(true);

    dealTrans = DealStateMachine.transition(states.COMMISSION_PAID, states.COMPLETED);
    expect(dealTrans.isValid).toBe(true);
  });
});
