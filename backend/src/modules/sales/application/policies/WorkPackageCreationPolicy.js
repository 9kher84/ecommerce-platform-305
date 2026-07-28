const { WorkPackage } = require('../../../../../sequelize_setup');
const PolicyExecutionMiddleware = require('../../../../shared/application/PolicyExecutionMiddleware');

/**
 * APPLICATION POLICY: WorkPackage Creation Policy
 * Listens to RequestPublishedEvent from Procurement Domain.
 * Responsibilities:
 * 1. Generate WorkPackage representation for Sales (Negotiation)
 */
async function workPackageCreationHandler(event, transaction) {
  const aggregateId = event.aggregateId;
  const { title, description } = event.payload || {};

  console.log(`[WorkPackageCreationPolicy] Creating WorkPackage for Request ${aggregateId}`);

  // In Wave 2.5, we create a single WorkPackage covering the entire PurchaseRequest.
  // In future waves, this might create multiple packages based on line items.
  const wp = await WorkPackage.create({
    purchaseRequestId: aggregateId,
    name: title || 'Default Package',
    description: description || '',
    status: 'open'
  }, { transaction });

  console.log(`[WorkPackageCreationPolicy] Successfully created WorkPackage ${wp.id}`);
}

// Wrap with Idempotency Middleware
module.exports = PolicyExecutionMiddleware.wrap('WorkPackageCreationPolicy', workPackageCreationHandler);
