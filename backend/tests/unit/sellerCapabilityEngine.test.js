const SellerCapabilityEngine = require("../../services/sellerCapabilityEngine");

describe("Seller Capability Engine Unit Suite", () => {
  test("1. Seller Capability Engine: should resolve tier modules for PRO tier", () => {
    const caps = SellerCapabilityEngine.getSellerCapabilities({ tier: "PRO" });
    expect(caps.enabledModules).toContain("INVENTORY");
    expect(caps.enabledModules).toContain("FINANCE");
    expect(caps.enabledModules).not.toContain("AUTOMATION");
  });

  test("2. Seller Capability Engine: should resolve enterprise modules for ENTERPRISE tier", () => {
    const caps = SellerCapabilityEngine.getSellerCapabilities({ tier: "ENTERPRISE" });
    expect(caps.enabledModules).toContain("AI_INTELLIGENCE");
    expect(caps.enabledModules).toContain("AUTOMATION");
    expect(caps.widgets.showAutomationRules).toBe(true);
  });

  test("3. Seller Capability Engine: should enforce Owner Policy Overrides (Master Switch Control)", () => {
    const caps = SellerCapabilityEngine.getSellerCapabilities({
      tier: "FREE",
      ownerPolicyOverrides: { AI_INTELLIGENCE: true, CUSTOMER_DEALS: false }
    });

    expect(caps.enabledModules).toContain("AI_INTELLIGENCE");
    expect(caps.enabledModules).not.toContain("CUSTOMER_DEALS");
  });
});
