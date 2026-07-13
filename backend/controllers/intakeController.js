const { createIntakeEngineComposition } = require("../bootstrap/intakeEngine.bootstrap");
const logger = require("../utils/logger");

// 1. Initialize Composition Root once
const {
  analyzeOpportunityUseCase,
  orchestrator
} = createIntakeEngineComposition();

class IntakeController {
  
  /**
   * POST /api/intake/analyze
   * Analyzes raw text and returns a validated DTO draft.
   */
  async analyze(req, res) {
    const startTime = Date.now();
    try {
      const { text } = req.body;
      const context = {
        userId: req.user ? req.user.id : null,
        organizationId: req.user ? req.user.organizationId : null,
        categoryId: req.body.categoryId || 1,
        correlationId: req.correlationId
      };

      const result = await analyzeOpportunityUseCase.execute(text, context);
      
      if (!result.validation.isValid) {
        logger.warn("[IntakeController.analyze] Validation failed", {
          correlationId: req.correlationId,
          userId: context.userId,
          executionTime: Date.now() - startTime
        });
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: result.validation.errors,
          warnings: result.validation.warnings,
          opportunity: result.opportunity
        });
      }

      logger.info("[IntakeController.analyze] Analysis successful", {
        correlationId: req.correlationId,
        userId: context.userId,
        executionTime: Date.now() - startTime
      });

      return res.status(200).json({
        success: true,
        correlationId: req.correlationId,
        opportunity: result.opportunity,
        validation: result.validation
      });
      
    } catch (error) {
      logger.error("[IntakeController.analyze] Error", {
        correlationId: req.correlationId,
        error: error.message,
        stack: error.stack,
        executionTime: Date.now() - startTime
      });
      return res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/intake/create
   * Accepts a validated DTO and persists it to the database.
   */
  async create(req, res) {
    const startTime = Date.now();
    try {
      const { opportunity, validationMetadata } = req.body;
      const context = {
        userId: req.user ? req.user.id : null,
        organizationId: req.user ? req.user.organizationId : null,
        categoryId: req.body.categoryId || 1, // Default to 1 if not provided
        correlationId: req.correlationId
      };

      if (!opportunity || !opportunity.type) {
        return res.status(400).json({ success: false, error: "Missing or invalid opportunity DTO" });
      }

      // Delegate to the Orchestrator
      const result = await orchestrator.executeWorkflow(opportunity, validationMetadata || {}, context);

      if (!result.success) {
        logger.warn("[IntakeController.create] Workflow execution failed", {
          correlationId: req.correlationId,
          userId: context.userId,
          executionTime: Date.now() - startTime
        });
        return res.status(400).json(result);
      }

      logger.info("[IntakeController.create] Workflow execution successful", {
        correlationId: req.correlationId,
        userId: context.userId,
        workflow: opportunity.type,
        executionTime: Date.now() - startTime
      });

      return res.status(201).json({
        success: true,
        data: result.data,
        workflowSteps: result.workflowSteps
      });

    } catch (error) {
      logger.error("[IntakeController.create] Error", {
        correlationId: req.correlationId,
        error: error.message,
        stack: error.stack,
        executionTime: Date.now() - startTime
      });
      return res.status(500).json({ success: false, error: 'DEPLOY_TEST: ' + error.message, stack: process.env.NODE_ENV === "production" ? null : error.stack });
    }
  }
}

module.exports = new IntakeController();
