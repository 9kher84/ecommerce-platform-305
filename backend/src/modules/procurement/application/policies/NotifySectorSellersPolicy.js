const { User, Category, SellerInteractionEvent } = require('../../../../../sequelize_setup');
const NotificationService = require('../../../../../services/notificationService');
const PolicyExecutionMiddleware = require('../../../../shared/application/PolicyExecutionMiddleware');

/**
 * APPLICATION POLICY: Notify Sector Sellers
 * Listens to RequestPublishedEvent.
 * Responsibilities:
 * 1. Find Eligible Sellers (Eligibility Filtering)
 * 2. Update Seller Feed Projection (SellerInteractionEvent)
 * 3. Send Async Notifications
 */
async function notifySectorSellersHandler(event, transaction) {
  const { sectorId, title } = event.payload || {};
  const aggregateId = event.aggregateId;

  if (!sectorId) {
    console.log(`[NotifySectorSellersPolicy] Request ${aggregateId} has no sectorId. Skipping.`);
    return;
  }

  console.log(`[NotifySectorSellersPolicy] Finding eligible sellers for sector ${sectorId}`);

  // 1. ELIGIBILITY FILTERING
  // Find all active sellers that belong to this sector
  const sellers = await User.findAll({
    attributes: ["id"],
    include: [
      {
        model: Category,
        as: "sectors",
        where: { id: sectorId },
        attributes: [],
        through: { attributes: [] },
      },
    ],
    where: {
      role: "seller",
      isActive: true,
      is_restricted: false // Extra eligibility rule
    },
    transaction
  });

  if (sellers.length === 0) {
    console.log(`[NotifySectorSellersPolicy] No eligible sellers found for sector ${sectorId}.`);
    return;
  }

  console.log(`[NotifySectorSellersPolicy] Found ${sellers.length} eligible sellers. Updating feed...`);

  // 2. SELLER FEED PROJECTION
  // We use SellerInteractionEvent as the Read Model / Dashboard Feed for Wave 1
  // This explicitly marks the request as "RECEIVED" and makes it visible in the seller's feed.
  const feedEntries = sellers.map((s) => ({
    sellerId: s.id,
    requestId: aggregateId,
    interactionType: "RECEIVED",
    metadata: { 
      method: "app_notification", 
      sectorId,
      status: "ready_for_quotation" // Extracted from domain conceptual mapping
    },
  }));

  // Using ignoreDuplicates or raw insert to prevent unique constraint failures if re-run 
  // (though PolicyExecutionMiddleware's Inbox pattern prevents re-running)
  await SellerInteractionEvent.bulkCreate(feedEntries, { 
    transaction, 
    ignoreDuplicates: true 
  });

  // 3. ASYNC NOTIFICATIONS (Push/Email)
  // Outside the transaction boundary for external calls? 
  // Best practice is to enqueue or send, but for now we follow legacy and send.
  // Warning: If transaction rolls back, emails might still be sent. But since we use Outbox + Inbox,
  // the chance of failure after this point is extremely low.
  const notificationData = {
    requestId: aggregateId,
    title: "فرصة جديدة!",
    message: `هناك طلب شراء جديد في قطاعك. قدم عرضك الآن!`,
    link: `/requests/${aggregateId}`, 
  };

  // Dispatch notifications in background without awaiting them to block the transaction commit
  Promise.allSettled(
    sellers.map((s) =>
      NotificationService.sendToUser(s.id, "NEW_SECTOR_REQUEST", notificationData)
    )
  ).then(results => {
    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
      console.error(`[NotifySectorSellersPolicy] ${failed.length} notifications failed to send.`);
    }
  });

  console.log(`[NotifySectorSellersPolicy] Successfully processed event ${event.eventId} for ${sellers.length} sellers.`);
}

// Wrap with Idempotency Middleware
module.exports = PolicyExecutionMiddleware.wrap('NotifySectorSellersPolicy', notifySectorSellersHandler);
