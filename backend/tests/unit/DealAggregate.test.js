const DealStateMachine = require('../../services/dealStateMachine');

describe('Deal Execution Aggregate Unit Tests (Sprint 4 Verification)', () => {
  test('should validate valid execution transition sequence from SUPPLIER_ACCEPTED to COMPLETED', () => {
    const states = DealStateMachine.STATES;

    // Step 1: Supplier Accepts -> Invoice Created
    let res = DealStateMachine.transition(states.SUPPLIER_ACCEPTED, states.INVOICE_CREATED);
    expect(res.isValid).toBe(true);

    // Step 2: Invoice Created -> Preparing Order
    res = DealStateMachine.transition(states.INVOICE_CREATED, states.PREPARING_ORDER);
    expect(res.isValid).toBe(true);

    // Step 3: Preparing Order -> Shipped
    res = DealStateMachine.transition(states.PREPARING_ORDER, states.SHIPPED);
    expect(res.isValid).toBe(true);

    // Step 4: Shipped -> Delivered
    res = DealStateMachine.transition(states.SHIPPED, states.DELIVERED);
    expect(res.isValid).toBe(true);

    // Step 5: Delivered -> Buyer Confirmed
    res = DealStateMachine.transition(states.DELIVERED, states.BUYER_CONFIRMED);
    expect(res.isValid).toBe(true);

    // Step 6: Buyer Confirmed -> Commission Pending
    res = DealStateMachine.transition(states.BUYER_CONFIRMED, states.COMMISSION_PENDING);
    expect(res.isValid).toBe(true);

    // Step 7: Commission Pending -> Commission Paid -> Completed
    res = DealStateMachine.transition(states.COMMISSION_PENDING, states.COMMISSION_PAID);
    expect(res.isValid).toBe(true);

    res = DealStateMachine.transition(states.COMMISSION_PAID, states.COMPLETED);
    expect(res.isValid).toBe(true);
  });

  test('should reject illegal transition from SHIPPED directly to COMPLETED', () => {
    const states = DealStateMachine.STATES;
    const res = DealStateMachine.transition(states.SHIPPED, states.COMPLETED);

    expect(res.isValid).toBe(false);
    expect(res.reason).toContain("Invalid transition");
  });

  test('should reject illegal transition from DELIVERED back to PREPARING_ORDER', () => {
    const states = DealStateMachine.STATES;
    const res = DealStateMachine.transition(states.DELIVERED, states.PREPARING_ORDER);

    expect(res.isValid).toBe(false);
    expect(res.reason).toContain("Invalid transition");
  });
});
