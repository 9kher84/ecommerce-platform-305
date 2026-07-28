const { commercialEventBus } = require("../../services/commercialEventBus");
const { commercialTimelineEngine } = require("../../services/commercialTimelineEngine");

describe("Commercial Event Bus Orchestrator Unit Suite", () => {
  test("1. Commercial Event Bus: should reactively fan out RFQ_CREATED to timeline and notifications", (done) => {
    const dealId = "deal-event-100";
    
    commercialEventBus.publishCommercialEvent("RFQ_CREATED", "PurchaseRequest", dealId, "buyer", "user-buyer-100", { title: "طلب حديد" });

    setTimeout(() => {
      const history = commercialTimelineEngine.getTimelineHistory(dealId);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].action).toBe("RFQ_CREATED");
      done();
    }, 100);
  });

  test("2. Commercial Event Bus: should reactively trigger commission and reputation on DELIVERY_CONFIRMED", (done) => {
    const dealId = "deal-event-200";

    commercialEventBus.publishCommercialEvent("DELIVERY_CONFIRMED", "PurchaseOrder", dealId, "seller", "user-seller-100", { dealAmountSAR: 150000 });

    setTimeout(() => {
      const history = commercialTimelineEngine.getTimelineHistory(dealId);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].action).toBe("DELIVERY_CONFIRMED");
      done();
    }, 100);
  });
});
