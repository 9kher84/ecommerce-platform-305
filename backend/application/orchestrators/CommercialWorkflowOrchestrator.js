const logger = require("../../utils/logger");

class CommercialWorkflowOrchestrator {
  constructor({
    sequelize,
    analyzeOpportunityUseCase,
    createCommercialAssetUseCase,
    createDemandIntentUseCase,
    pricingEngine,
    notificationPolicyService,
    matchService,
    inventoryEngine,
    updateAssetMetricsUseCase
  }) {
    this.sequelize = sequelize;
    this.analyzeOpportunityUseCase = analyzeOpportunityUseCase;
    this.createCommercialAssetUseCase = createCommercialAssetUseCase;
    this.createDemandIntentUseCase = createDemandIntentUseCase;
    this.pricingEngine = pricingEngine;
    this.notificationPolicyService = notificationPolicyService;
    this.matchService = matchService;
    this.inventoryEngine = inventoryEngine;
    this.updateAssetMetricsUseCase = updateAssetMetricsUseCase;
  }

  /**
   * Orchestrates the complete end-to-end flow starting from a validated DTO.
   */
  async executeWorkflow(opportunity, validation, context) {
    let createdAsset;
    let workflowSteps = [];
    const t = await this.sequelize.transaction();
    context.transaction = t; // Pass transaction to use cases

    const startTime = Date.now();

    try {
      logger.info(`[Orchestrator] Starting workflow execution`, {
        correlationId: context.correlationId,
        userId: context.userId,
        workflow: opportunity.type
      });

      // 1. Route based on type
      if (opportunity.type === "SUPPLY") {
        // --- SUPPLY WORKFLOW ---
        createdAsset = await this.createCommercialAssetUseCase.execute(opportunity, validation, context);
        if (createdAsset.toJSON) createdAsset = createdAsset.toJSON();
        workflowSteps.push("Create Product");

        // CRITICAL: Pricing Recommendation
        if (this.pricingEngine && this.pricingEngine.generatePriceRecommendation) {
          const mockUser = { maturity_level: "BASIC", subscriptionTier: "plan_a" };
          const mockRequest = { sectorId: context.categoryId || 1 };
          
          const priceRec = await this.pricingEngine.generatePriceRecommendation(mockUser, mockRequest, createdAsset);
          
          createdAsset.recommendedPrice = priceRec.suggestedPrice;
          if (this.updateAssetMetricsUseCase) {
            await this.updateAssetMetricsUseCase.execute("SUPPLY", createdAsset.id, { recommendedPrice: priceRec.suggestedPrice }, context);
          }
          workflowSteps.push("Pricing");
        }

      } else if (opportunity.type === "DEMAND") {
        // --- DEMAND WORKFLOW ---
        createdAsset = await this.createDemandIntentUseCase.execute(opportunity, validation, context);
        if (createdAsset.toJSON) createdAsset = createdAsset.toJSON();
        workflowSteps.push("Create PurchaseRequest");
      }

      // Commit the transaction after CRITICAL steps succeed
      await t.commit();
      logger.info(`[Orchestrator] Transaction committed for ${opportunity.type}`, {
        correlationId: context.correlationId,
        userId: context.userId,
        executionTime: Date.now() - startTime,
        status: "success"
      });

    } catch (error) {
      await t.rollback();
      logger.error(`[Orchestrator] Transaction rolled back due to error in CRITICAL step`, {
        correlationId: context.correlationId,
        userId: context.userId,
        workflow: opportunity.type,
        error: error.message,
        stack: error.stack,
        status: "failed",
        executionTime: Date.now() - startTime
      });
      throw error;
    }

    // --- NON-CRITICAL WORKFLOW STEPS ---
    // These run outside the transaction, and their failure does not fail the request.
    try {
      if (opportunity.type === "SUPPLY") {
        // Notifications
        if (this.notificationPolicyService && this.notificationPolicyService.processProductOpportunity) {
          await this.notificationPolicyService.processProductOpportunity(context.userId, createdAsset.categoryId);
          workflowSteps.push("Notification");
        }
        // Inventory
        if (this.inventoryEngine && this.inventoryEngine.analyzeInventoryPressure) {
          await this.inventoryEngine.analyzeInventoryPressure(context.userId);
          workflowSteps.push("Inventory");
        }
      } else if (opportunity.type === "DEMAND") {
        // Matching
        if (this.matchService && this.matchService.findMatchesForRequest) {
          const matches = await this.matchService.findMatchesForRequest(createdAsset.id);
          createdAsset.matchesCount = matches.length;
          if (this.updateAssetMetricsUseCase) {
            // Intentionally saving without transaction since it's non-critical
            await this.updateAssetMetricsUseCase.execute("DEMAND", createdAsset.id, { matchesCount: matches.length });
          }
          workflowSteps.push("Matching");
        }
        workflowSteps.push("Notification"); // Placeholder if Demand notification implemented
      }
    } catch (nonCriticalError) {
      logger.error(`[Orchestrator] Error in NON-CRITICAL step`, {
        correlationId: context.correlationId,
        userId: context.userId,
        workflow: opportunity.type,
        error: nonCriticalError.message,
        stack: nonCriticalError.stack,
        status: "partial_success",
      });
      // Do NOT throw error. Allow the process to return success for the critical asset.
    }

    return {
      success: true,
      data: createdAsset,
      workflowSteps
    };
  }
}

module.exports = CommercialWorkflowOrchestrator;
