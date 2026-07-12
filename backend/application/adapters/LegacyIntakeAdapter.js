const CommercialOpportunityDTO = require("../../engine/intake/domain/CommercialOpportunityDTO");
const logger = require("../../utils/logger");

/**
 * Adapter Layer to route legacy API requests to the new Universal Intake Engine.
 * Controlled by ENABLE_UNIVERSAL_INTAKE feature flag.
 */
const legacyIntakeAdapter = (type) => async (req, res, next) => {
  if (process.env.ENABLE_UNIVERSAL_INTAKE !== "true") {
    return next(); // Fallback to legacy controller
  }

  const startTime = Date.now();
  try {
    const { categoryId, sectorId } = req.body;
    let dtoPayload = {};

    if (type === "SUPPLY") {
      const { name, quantity, estimatedPrice, unit } = req.body;
      dtoPayload = {
        type: "SUPPLY",
        categoryId: categoryId || 1,
        name: name,
        quantity: quantity,
        price: estimatedPrice,
        unit: unit || "piece"
      };
    } else if (type === "DEMAND") {
      const { title, quantity, estimatedPrice, unit } = req.body;
      dtoPayload = {
        type: "DEMAND",
        categoryId: categoryId || sectorId || 1,
        name: title,
        quantity: quantity,
        price: estimatedPrice,
        unit: unit || "piece"
      };
    } else {
      return next();
    }

    // Convert to DTO
    const opportunity = new CommercialOpportunityDTO(dtoPayload);
    
    // Construct context
    const context = {
      userId: req.user ? req.user.id : null,
      categoryId: opportunity.categoryId,
      source: "legacy_api_adapter",
      correlationId: req.correlationId
    };

    // Forward to Orchestrator
    const { orchestrator } = require("../../bootstrap/intakeEngine.bootstrap").createIntakeEngineComposition();
    const result = await orchestrator.executeWorkflow(opportunity, { bypassValidation: true }, context);

    if (!result.success) {
      logger.warn("[LegacyIntakeAdapter] Workflow failed", {
        correlationId: req.correlationId,
        userId: context.userId,
        executionTime: Date.now() - startTime
      });
      return res.status(400).json(result);
    }

    logger.info("[LegacyIntakeAdapter] Workflow successful", {
      correlationId: req.correlationId,
      userId: context.userId,
      executionTime: Date.now() - startTime
    });

    // Return the response matching the old format to maintain contract
    if (type === "SUPPLY") {
      return res.status(201).json({
        success: true,
        product: result.data,
        adapterUsed: true
      });
    } else {
      return res.status(201).json({
        success: true,
        message: "Purchase request created successfully",
        data: result.data,
        adapterUsed: true
      });
    }
  } catch (error) {
    logger.error("[LegacyIntakeAdapter] Error routing to new engine", {
      correlationId: req.correlationId,
      error: error.message,
      stack: error.stack,
      executionTime: Date.now() - startTime
    });
    return res.status(500).json({ success: false, message: error.message, adapterUsed: true });
  }
};

module.exports = legacyIntakeAdapter;
