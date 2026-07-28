const asyncHandler = require('express-async-handler');
const AcceptQuotationUseCase = require('../../application/use-cases/AcceptQuotationUseCase');
const QuotationRepository = require('../../repositories/QuotationRepository');
const TransactionManager = require('../../../../../shared/application/TransactionManager');

class AcceptQuotationControllerV2 {
  /**
   * @desc    Accept a Quotation
   * @route   POST /api/v2/quotations/:id/accept
   * @access  Private (Buyer)
   */
  static acceptQuotation = asyncHandler(async (req, res) => {
    const quotationRepo = new QuotationRepository();
    const transactionManager = new TransactionManager();

    const acceptUseCase = new AcceptQuotationUseCase({
      quotationRepo,
      transactionManager
    });

    const command = {
      quotationId: req.params.id,
      buyerOrganizationId: req.user ? req.user.organizationId : 'MOCK_BUYER_ORG_ID',
      expectedVersion: req.body.expectedVersion
    };

    const quotation = await acceptUseCase.execute(command);

    res.status(200).json({
      success: true,
      message: 'Quotation accepted successfully',
      data: {
        id: quotation.id,
        status: quotation.status,
        version: quotation.version
      }
    });
  });
}

module.exports = AcceptQuotationControllerV2;
