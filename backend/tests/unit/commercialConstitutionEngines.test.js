const DealStateMachine = require("../../services/dealStateMachine");
const CommercialRulesEngine = require("../../services/commercialRulesEngine");
const SlaAndEscalationEngine = require("../../services/slaAndEscalationEngine");
const NotificationMatrixAndTimeline = require("../../services/notificationMatrixAndTimeline");
const DisputeAndFinancialLedger = require("../../services/disputeAndFinancialLedger");

describe("Commercial Constitution Core Engines Unit Suite", () => {
  test("1. Deal State Machine: should validate allowed state transitions and block invalid transitions", () => {
    const valid = DealStateMachine.transition(DealStateMachine.STATES.RFQ_OPEN, DealStateMachine.STATES.QUOTES_RECEIVING);
    expect(valid.isValid).toBe(true);

    const invalid = DealStateMachine.transition(DealStateMachine.STATES.RFQ_OPEN, DealStateMachine.STATES.COMPLETED);
    expect(invalid.isValid).toBe(false);
  });

  test("2. Commercial Rules Engine: should evaluate Rule 001 and Rule 005", () => {
    const r1 = CommercialRulesEngine.evaluateRule("RULE_001", { isEditAttempt: true });
    expect(r1.isPassed).toBe(false);

    const r5 = CommercialRulesEngine.evaluateRule("RULE_005", { unpaidCommissionCount: 3 });
    expect(r5.isPassed).toBe(false);
  });

  test("3. SLA & Escalation Engine: should check quote SLA and handle MIA escalation", () => {
    const quoteSla = SlaAndEscalationEngine.checkQuoteSla({ id: "q-1" });
    expect(quoteSla.status).toBeDefined();

    const mia = SlaAndEscalationEngine.handleMiaEscalation("deal-100", new Date(Date.now() - 80 * 3600 * 1000));
    expect(mia.isMia).toBe(true);
    expect(mia.action).toBe("TRIGGER_AUTO_CANCEL_OR_CASCADE");
  });

  test("4. Notification Matrix & Audit Timeline: should dispatch notifications and build Git-like timeline", () => {
    const notif = NotificationMatrixAndTimeline.dispatchEventNotification("RFQ_CREATED", { rfqId: "rfq-1" });
    expect(notif.dispatched).toBe(true);

    const timeline = NotificationMatrixAndTimeline.generateGitLikeTimeline([{ action: "RFQ_CREATED" }]);
    expect(timeline.length).toBe(1);
    expect(timeline[0].commitId).toBeDefined();
  });

  test("5. Dispute Engine & Financial Ledger: should file dispute and post ledger entry", () => {
    const dsp = DisputeAndFinancialLedger.fileDispute("deal-1", "user-1", "Late shipment");
    expect(dsp.status).toBe("OPEN_UNDER_REVIEW");

    const ledger = DisputeAndFinancialLedger.recordLedgerEntry("ACC-COMMISSION", 500, "CREDIT", "deal-1", "Platform commission");
    expect(ledger.type).toBe("CREDIT");
  });
});
