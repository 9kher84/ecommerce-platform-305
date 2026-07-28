describe('Invoice & Finance Aggregate Unit Tests (Sprint 5 Verification)', () => {
  const INVOICE_STATES = {
    DRAFT: 'draft',
    ISSUED: 'issued',
    APPROVED: 'approved',
    PAID: 'paid',
    SETTLED: 'settled',
    CLOSED: 'closed'
  };

  function canTransition(current, next) {
    const valid = {
      draft: ['issued'],
      issued: ['approved', 'cancelled'],
      approved: ['paid', 'disputed'],
      paid: ['settled'],
      settled: ['closed']
    };

    return (valid[current] || []).includes(next);
  }

  function calculatePlatformCommission(totalAmount, commissionRate = 0.025) {
    const commission = totalAmount * commissionRate;
    const sellerPayout = totalAmount - commission;
    return {
      totalAmount,
      commissionAmount: parseFloat(commission.toFixed(2)),
      sellerPayoutAmount: parseFloat(sellerPayout.toFixed(2))
    };
  }

  function processPayment(invoice, dealState) {
    if (!dealState || dealState.goodsDelivered !== true || dealState.buyerConfirmed !== true) {
      throw new Error('INVARIANT_VIOLATION: Cannot process payment before delivery and buyer confirmation.');
    }

    if (!canTransition(invoice.status, 'paid')) {
      throw new Error(`INVALID_TRANSITION: Cannot transition invoice from ${invoice.status} to paid.`);
    }

    invoice.status = 'paid';
    return invoice;
  }

  test('should accurately calculate 2.5% platform commission and payout', () => {
    const res = calculatePlatformCommission(10000, 0.025);
    expect(res.commissionAmount).toBe(250);
    expect(res.sellerPayoutAmount).toBe(9750);
  });

  test('should block payment if goods are not delivered and confirmed by buyer', () => {
    const invoice = { id: 'inv-1', status: 'approved' };
    const unconfirmedDealState = { goodsDelivered: false, buyerConfirmed: false };

    expect(() => {
      processPayment(invoice, unconfirmedDealState);
    }).toThrow('INVARIANT_VIOLATION');
  });

  test('should allow payment processing after buyer confirmation and delivery', () => {
    const invoice = { id: 'inv-1', status: 'approved' };
    const confirmedDealState = { goodsDelivered: true, buyerConfirmed: true };

    const updatedInvoice = processPayment(invoice, confirmedDealState);
    expect(updatedInvoice.status).toBe('paid');
  });

  test('should reject illegal invoice state transition from draft directly to paid', () => {
    expect(canTransition('draft', 'paid')).toBe(false);
  });
});
