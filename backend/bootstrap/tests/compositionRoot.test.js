const { createIntakeEngineComposition } = require("../intakeEngine.bootstrap");
const AnalyzeOpportunityUseCase = require("../../application/usecases/AnalyzeOpportunityUseCase");
const CreateCommercialAssetUseCase = require("../../application/usecases/CreateCommercialAssetUseCase");
const CreateDemandIntentUseCase = require("../../application/usecases/CreateDemandIntentUseCase");

describe("Phase 2.9: Composition Root & Dependency Wiring", () => {
  it("should wire up all dependencies without circular dependencies", () => {
    // 1. Mock external systems
    const mockDb = {
      Product: {},
      PurchaseRequest: {}
    };
    const mockExternalServices = {
      pricingEngine: { generatePriceRecommendation: jest.fn() }
    };

    // 2. Execute Composition Root
    const useCases = createIntakeEngineComposition(mockDb, mockExternalServices);

    // 3. Assert all components are successfully wired and exposed
    expect(useCases).toBeDefined();
    expect(useCases.analyzeOpportunityUseCase).toBeInstanceOf(AnalyzeOpportunityUseCase);
    expect(useCases.createCommercialAssetUseCase).toBeInstanceOf(CreateCommercialAssetUseCase);
    expect(useCases.createDemandIntentUseCase).toBeInstanceOf(CreateDemandIntentUseCase);
    
    // 4. Assert internal wiring inside analyzeOpportunityUseCase
    const analyzeUseCase = useCases.analyzeOpportunityUseCase;
    expect(analyzeUseCase.engine).toBeDefined();
    expect(analyzeUseCase.engine.parser).toBeDefined();
    expect(analyzeUseCase.engine.validationPipeline).toBeDefined();
    expect(analyzeUseCase.engine.validationPipeline.validators.length).toBe(2);
  });
});
