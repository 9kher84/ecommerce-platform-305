const legacyIntakeAdapter = require("./application/adapters/LegacyIntakeAdapter");
const mockReq = {
  body: {
    name: "Old Supply Object",
    quantity: 500,
    estimatedPrice: 35,
    unit: "tons",
    categoryId: 2,
    sectorId: 1
  },
  user: { id: "legacy-user-123" },
  correlationId: "corr-legacy-123"
};

const mockRes = {
  status: (code) => ({ json: (data) => console.log("Response:", code, data) })
};

const next = () => console.log("Next called");

// Override orchestrator to capture what it receives
const orchestratorBootstrap = require("./bootstrap/intakeEngine.bootstrap");
orchestratorBootstrap.orchestrator = {
  executeWorkflow: async (opportunity, options, context) => {
    console.log("--- Object received by UniversalIntakeService (Orchestrator) ---");
    console.log(JSON.stringify({ opportunity, options, context }, null, 2));
    return { success: true };
  }
};

process.env.ENABLE_UNIVERSAL_INTAKE = "true";
const middleware = legacyIntakeAdapter("SUPPLY");

console.log("--- Request القادم ---");
console.log(JSON.stringify(mockReq.body, null, 2));

middleware(mockReq, mockRes, next).catch(console.error);
