/**
 * Composition Root for Intake Engine
 * This file is the ONLY place where dependencies are instantiated.
 */

// 1. Parsers
const HeuristicParser = require("../engine/intake/parsers/HeuristicParser");
// const OpenAIParser = require("../engine/intake/parsers/OpenAIParser"); // Can be swapped here

// 2. Validators
const SyntaxValidator = require("../engine/intake/validators/SyntaxValidator");
const PricingValidator = require("../engine/intake/validators/PricingValidator");
const ValidationPipeline = require("../engine/intake/validators/ValidationPipeline");

// 3. Services / Engines
const UniversalIntakeService = require("../engine/intake/UniversalIntakeService");

// 4. Infrastructure (Repositories)
// Usually we pass actual Sequelize models here: require('../models').Product
const ProductRepository = require("../infrastructure/repositories/ProductRepository");
const PurchaseRequestRepository = require("../infrastructure/repositories/PurchaseRequestRepository");

// 5. Use Cases
const AnalyzeOpportunityUseCase = require("../application/usecases/AnalyzeOpportunityUseCase");
const CreateCommercialAssetUseCase = require("../application/usecases/CreateCommercialAssetUseCase");
const CreateDemandIntentUseCase = require("../application/usecases/CreateDemandIntentUseCase");

/**
 * Bootstraps and wires up the entire Universal Intake Engine subsystem.
 * @param {Object} db - The Sequelize DB models object
 * @param {Object} externalServices - Other external services (e.g. PricingEngine)
 */
function createIntakeEngineComposition(db = null, externalServices = {}) {
  // Fallback to real DB if not provided (for production usage)
  if (!db) {
    const sequelizeSetup = require("../sequelize_setup");
    db = {
      Product: sequelizeSetup.Product,
      PurchaseRequest: sequelizeSetup.PurchaseRequest,
      sequelize: sequelizeSetup.sequelize
    };
  }
  
  if (!externalServices.pricingEngine) {
    try { externalServices.pricingEngine = require("../services/pricingEngine"); } catch (e) { }
  }
  if (!externalServices.notificationPolicyService) {
    try { externalServices.notificationPolicyService = require("../services/notificationPolicyService"); } catch (e) { }
  }
  if (!externalServices.matchService) {
    try { externalServices.matchService = require("../services/MatchService"); } catch (e) { }
  }
  if (!externalServices.inventoryEngine) {
    try { externalServices.inventoryEngine = require("../services/inventoryEngine"); } catch (e) { }
  }

  // --- A. Instantiate Parsers ---
  const parser = new HeuristicParser(); // Swap to OpenAIParser here when ready

  // --- B. Instantiate Validators ---
  const syntaxValidator = new SyntaxValidator();
  // Pass existing PricingEngine logic from legacy system or externalServices
  const pricingValidator = new PricingValidator(externalServices.pricingEngine);
  
  // --- C. Instantiate Pipeline ---
  const validationPipeline = new ValidationPipeline([
    syntaxValidator,
    pricingValidator
  ]);

  // --- D. Instantiate Core Engine ---
  const intakeService = new UniversalIntakeService(parser, validationPipeline);

  // --- E. Instantiate Repositories ---
  const productRepo = new ProductRepository(db.Product);
  const purchaseRequestRepo = new PurchaseRequestRepository(db.PurchaseRequest);

  // --- F. Instantiate Application Use Cases ---
  const analyzeOpportunityUseCase = new AnalyzeOpportunityUseCase(intakeService);
  const createCommercialAssetUseCase = new CreateCommercialAssetUseCase(productRepo);
  const createDemandIntentUseCase = new CreateDemandIntentUseCase(purchaseRequestRepo);
  const UpdateAssetMetricsUseCase = require("../application/usecases/UpdateAssetMetricsUseCase");
  const updateAssetMetricsUseCase = new UpdateAssetMetricsUseCase(productRepo, purchaseRequestRepo);

  // --- E. Instantiate Workflow Orchestrator ---
  const CommercialWorkflowOrchestrator = require("../application/orchestrators/CommercialWorkflowOrchestrator");
  const orchestrator = new CommercialWorkflowOrchestrator({
    sequelize: db.sequelize || require("../sequelize_setup").sequelize,
    analyzeOpportunityUseCase,
    createCommercialAssetUseCase,
    createDemandIntentUseCase,
    updateAssetMetricsUseCase,
    pricingEngine: externalServices.pricingEngine,
    notificationPolicyService: externalServices.notificationPolicyService,
    matchService: externalServices.matchService,
    inventoryEngine: externalServices.inventoryEngine
  });

  // Return the configured orchestrator and use cases
  return {
    orchestrator,
    analyzeOpportunityUseCase,
    createCommercialAssetUseCase,
    createDemandIntentUseCase,
    engine: intakeService
  };
}

module.exports = {
  createIntakeEngineComposition
};
