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

  console.log(`[WorkPackageCreationPolicy] Processing WorkPackage for Request ${aggregateId}`);

  // 1. Idempotency Check: Do not create duplicate WorkPackage for an existing PurchaseRequest
  const existingWp = await WorkPackage.findOne({
    where: { purchaseRequestId: aggregateId },
    transaction
  });

  if (existingWp) {
    console.log(`[WorkPackageCreationPolicy] WorkPackage already exists for Request ${aggregateId} (${existingWp.id}). Skipping duplicate creation.`);
    return existingWp;
  }

  // 2. Create single default WorkPackage covering the PurchaseRequest
  const wp = await WorkPackage.create({
    purchaseRequestId: aggregateId,
    name: title || 'Default Package',
    description: description || '',
    status: 'open'
  }, { transaction });

  console.log(`[WorkPackageCreationPolicy] Successfully created WorkPackage ${wp.id}`);
  return wp;
}

// Wrap with Idempotency Middleware
module.exports = PolicyExecutionMiddleware.wrap('WorkPackageCreationPolicy', workPackageCreationHandler);
