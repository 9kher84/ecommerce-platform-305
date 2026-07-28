/**
 * Deal State Machine
 * Centralized, immutable state machine for Commercial Deal Life-Cycle.
 */
class DealStateMachine {
  static STATES = {
    RFQ_OPEN: "RFQ_OPEN",
    QUOTES_RECEIVING: "QUOTES_RECEIVING",
    NEGOTIATION: "NEGOTIATION",
    PRIMARY_SELECTED: "PRIMARY_SELECTED",
    WAITING_SUPPLIER_CONFIRMATION: "WAITING_SUPPLIER_CONFIRMATION",
    SUPPLIER_ACCEPTED: "SUPPLIER_ACCEPTED",
    INVOICE_CREATED: "INVOICE_CREATED",
    PREPARING_ORDER: "PREPARING_ORDER",
    SHIPPED: "SHIPPED",
    DELIVERED: "DELIVERED",
    BUYER_CONFIRMED: "BUYER_CONFIRMED",
    COMMISSION_PENDING: "COMMISSION_PENDING",
    COMMISSION_PAID: "COMMISSION_PAID",
    COMPLETED: "COMPLETED",
    CASCASED_TO_BACKUP_1: "CASCASED_TO_BACKUP_1",
    CASCASED_TO_BACKUP_2: "CASCASED_TO_BACKUP_2",
    BUYER_CANCELLED: "BUYER_CANCELLED",
    AUTO_CANCELLED: "AUTO_CANCELLED"
  };

  /**
   * Evaluates if state transition from currentState to nextState is valid
   */
  static transition(currentState, nextState) {
    const validTransitions = {
      [this.STATES.RFQ_OPEN]: [this.STATES.QUOTES_RECEIVING, this.STATES.BUYER_CANCELLED],
      [this.STATES.QUOTES_RECEIVING]: [this.STATES.NEGOTIATION, this.STATES.PRIMARY_SELECTED, this.STATES.BUYER_CANCELLED],
      [this.STATES.NEGOTIATION]: [this.STATES.PRIMARY_SELECTED, this.STATES.QUOTES_RECEIVING, this.STATES.BUYER_CANCELLED],
      [this.STATES.PRIMARY_SELECTED]: [this.STATES.WAITING_SUPPLIER_CONFIRMATION],
      [this.STATES.WAITING_SUPPLIER_CONFIRMATION]: [this.STATES.SUPPLIER_ACCEPTED, this.STATES.CASCASED_TO_BACKUP_1, this.STATES.AUTO_CANCELLED],
      [this.STATES.CASCASED_TO_BACKUP_1]: [this.STATES.SUPPLIER_ACCEPTED, this.STATES.CASCASED_TO_BACKUP_2],
      [this.STATES.SUPPLIER_ACCEPTED]: [this.STATES.INVOICE_CREATED],
      [this.STATES.INVOICE_CREATED]: [this.STATES.PREPARING_ORDER],
      [this.STATES.PREPARING_ORDER]: [this.STATES.SHIPPED],
      [this.STATES.SHIPPED]: [this.STATES.DELIVERED],
      [this.STATES.DELIVERED]: [this.STATES.BUYER_CONFIRMED],
      [this.STATES.BUYER_CONFIRMED]: [this.STATES.COMMISSION_PENDING],
      [this.STATES.COMMISSION_PENDING]: [this.STATES.COMMISSION_PAID],
      [this.STATES.COMMISSION_PAID]: [this.STATES.COMPLETED]
    };

    const allowed = validTransitions[currentState] || [];
    if (!allowed.includes(nextState)) {
      return {
        isValid: false,
        currentState,
        nextState,
        reason: `Invalid transition from '${currentState}' to '${nextState}'. Allowed: [${allowed.join(", ")}]`
      };
    }

    return {
      isValid: true,
      currentState,
      nextState,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = DealStateMachine;
