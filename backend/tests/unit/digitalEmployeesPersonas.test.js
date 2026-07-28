const { procurementOfficerPersona } = require("../../services/personas/procurementOfficerPersona");
const { financeOfficerPersona } = require("../../services/personas/financeOfficerPersona");
const { logisticsOfficerPersona } = require("../../services/personas/logisticsOfficerPersona");
const { salesOfficerPersona } = require("../../services/personas/salesOfficerPersona");
const { executiveOfficerPersona } = require("../../services/personas/executiveOfficerPersona");
const { OrganizationMembership, MembershipPermission } = require("../../sequelize_setup");

describe("Digital Employee Officers Personas Unit Suite", () => {
  const context = { userId: "user-persona-100", organizationId: "org-persona-100", amount: 15000 };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("1. Procurement Officer Persona: should execute procurement reasoning and return recommendation", async () => {
    const res = await procurementOfficerPersona.handleReasoning(context, "أريد توريد 200 طن حديد");
    expect(res.success).toBe(true);
    expect(res.role).toBe("PROCUREMENT_OFFICER");
    expect(res.confidencePercent).toBeGreaterThan(90);
  });

  test("2. Finance Officer Persona: should audit budget limits and VAT compliance", async () => {
    const res = await financeOfficerPersona.handleReasoning(context, "فحص فاتورة SAR 15000");
    expect(res.success).toBe(true);
    expect(res.role).toBe("FINANCE_OFFICER");
    expect(res.financialAudit.vatAmountSAR).toBe(2250);
  });

  test("3. Logistics Officer Persona: should track SLA and dispatch status", async () => {
    const res = await logisticsOfficerPersona.handleReasoning(context, "متابعة شحنة خرسانة");
    expect(res.success).toBe(true);
    expect(res.role).toBe("LOGISTICS_OFFICER");
    expect(res.logisticsStatus.slaStatus).toBe("ON_TIME");
  });

  test("4. Sales Officer Persona: should calculate win probability and proposal strategy", async () => {
    const res = await salesOfficerPersona.handleReasoning(context, "تقديم عرض سعر منافس");
    expect(res.success).toBe(true);
    expect(res.role).toBe("SALES_OFFICER");
    expect(res.salesProposal.analysis.recommendedCounterPrice).toBeDefined();
  });

  test("5. Executive Officer Persona: should orchestrate multi-agent collaboration", async () => {
    jest.spyOn(OrganizationMembership, "findOne").mockResolvedValue({ id: "mem-persona-100", isOwner: true });
    jest.spyOn(MembershipPermission, "findAll").mockResolvedValue([
      { effect: "ALLOW", permission: { key: "CREATE_RFQ" } }
    ]);

    const res = await executiveOfficerPersona.handleReasoning(context, "أمر تنفيذي للشراء");
    expect(res.success).toBe(true);
    expect(res.role).toBe("CHIEF_EXECUTIVE_OFFICER");
    expect(res.executiveSummary.assignedAgent).toBeDefined();
  });
});
