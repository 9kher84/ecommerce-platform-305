const asyncHandler = require('express-async-handler');
const CreateAwardUseCase = require('../../application/use-cases/CreateAwardUseCase');
const ConfirmAwardUseCase = require('../../application/use-cases/ConfirmAwardUseCase');
const CancelAwardUseCase = require('../../application/use-cases/CancelAwardUseCase');
const CompleteAwardUseCase = require('../../application/use-cases/CompleteAwardUseCase');
const AwardRepository = require('../../repositories/AwardRepository');
const QuotationRepository = require('../../../procurement/repositories/QuotationRepository');
const TransactionManager = require('../../../../shared/application/TransactionManager');

class AwardControllerV2 {
  
  /**
   * @desc    Create a new Award from an accepted Quotation
   * @route   POST /api/v2/awards
   * @access  Private (Buyer)
   */
  static createAward = asyncHandler(async (req, res) => {
    // Inject dependencies (in a real app, use a DI container)
    const awardRepo = new AwardRepository();
    const quotationRepo = new QuotationRepository();
    const transactionManager = new TransactionManager();

    const createAwardUseCase = new CreateAwardUseCase({
      awardRepo,
      quotationRepo,
      transactionManager
    });

    const command = {
      quotationId: req.body.quotationId,
      notes: req.body.notes,
      actorId: req.user.id
    };

    const award = await createAwardUseCase.execute(command);

    res.status(201).json({
      success: true,
      message: 'Award created successfully',
      data: {
        id: award.id,
        status: award.status,
        totalAmount: award.totalAmount
      }
    });
  });

  /**
   * @desc    Confirm an Award
   * @route   POST /api/v2/awards/:id/confirm
   * @access  Private (Buyer)
   */
  static confirmAward = asyncHandler(async (req, res) => {
    const awardRepo = new AwardRepository();
    const transactionManager = new TransactionManager();

    const confirmUseCase = new ConfirmAwardUseCase({
      awardRepo,
      transactionManager
    });

    const command = {
      awardId: req.params.id,
      actorId: req.user ? req.user.id : 'MOCK_ACTOR_ID',
      expectedVersion: req.body.expectedVersion
    };

    const award = await confirmUseCase.execute(command);

    res.status(200).json({
      success: true,
      message: 'Award confirmed successfully',
      data: {
        id: award.id,
        status: award.status,
        version: award.version
      }
    });
  });

  /**
   * @desc    Cancel an Award
   * @route   POST /api/v2/awards/:id/cancel
   * @access  Private (Buyer)
   */
  static cancelAward = asyncHandler(async (req, res) => {
    const awardRepo = new AwardRepository();
    const transactionManager = new TransactionManager();

    const cancelUseCase = new CancelAwardUseCase({
      awardRepo,
      transactionManager
    });

    const command = {
      awardId: req.params.id,
      reason: req.body.reason,
      actorId: req.user ? req.user.id : 'MOCK_ACTOR_ID',
      expectedVersion: req.body.expectedVersion
    };

    const award = await cancelUseCase.execute(command);

    res.status(200).json({
      success: true,
      message: 'Award cancelled successfully',
      data: {
        id: award.id,
        status: award.status,
        version: award.version
      }
    });
  });

  /**
   * @desc    Complete an Award
   * @route   POST /api/v2/awards/:id/complete
   * @access  Private (Buyer)
   */
  static completeAward = asyncHandler(async (req, res) => {
    const awardRepo = new AwardRepository();
    const transactionManager = new TransactionManager();

    const completeUseCase = new CompleteAwardUseCase({
      awardRepo,
      transactionManager
    });

    const command = {
      awardId: req.params.id,
      actorId: req.user ? req.user.id : 'MOCK_ACTOR_ID',
      expectedVersion: req.body.expectedVersion
    };

    const award = await completeUseCase.execute(command);

    res.status(200).json({
      success: true,
      message: 'Award completed successfully',
      data: {
        id: award.id,
        status: award.status,
        version: award.version
      }
    });
  });
}

module.exports = AwardControllerV2;
