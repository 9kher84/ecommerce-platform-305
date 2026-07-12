const { execSync } = require('child_process');
const { 
  sequelize, 
  PurchaseRequest, 
  PriceQuote, 
  Deal, 
  Invoice, 
  CommissionTransaction, 
  Notification 
} = require('./sequelize_setup');

async function runVerification() {
  try {
    console.log("--- 1. Running simulate_cycle.js ---");
    execSync('node simulate_cycle.js', { stdio: 'pipe' });
    
    console.log("\n--- 2. Fetching Evidences from Database ---");

    // Get the latest Deal as the anchor point
    const deal = await Deal.findOne({
      order: [['createdAt', 'DESC']]
    });

    if (!deal) {
      throw new Error("No deal found in DB. The cycle might have failed.");
    }

    const request = await PurchaseRequest.findByPk(deal.purchaseRequestId);
    const quote = await PriceQuote.findByPk(deal.priceQuoteId);
    
    // Invoices are independent now per dealService.js: InvoiceService.createInvoice
    // Wait, Deal doesn't have an Invoice association in include maybe, so let's query Invoice directly
    const invoice = await sequelize.models.Invoice.findOne({
      where: { dealId: deal.id },
      order: [['createdAt', 'DESC']]
    });

    const commission = await CommissionTransaction.findOne({
      where: { dealId: deal.id },
      order: [['createdAt', 'DESC']]
    });

    const notifications = await Notification.findAll({
      order: [['createdAt', 'DESC']],
      limit: 2
    });

    console.log("\n### أولاً: Purchase Request");
    console.log(`* id: ${request.id}`);
    console.log(`* status: ${request.status || request.rfqStatus}`);
    console.log(`* buyerId: ${request.userId}`);

    console.log("\n### ثانياً: Quote");
    console.log(`* id: ${quote.id}`);
    console.log(`* requestId: ${quote.purchaseRequestId}`);
    console.log(`* sellerId: ${quote.sellerId}`);
    console.log(`* status: ${quote.status}`);

    console.log("\n### ثالثاً: Deal");
    console.log(`* id: ${deal.id}`);
    console.log(`* requestId: ${deal.purchaseRequestId}`);
    console.log(`* quoteId: ${deal.priceQuoteId}`);
    console.log(`* buyerId: ${deal.buyerId}`);
    console.log(`* sellerId: ${deal.sellerId}`);

    console.log("\n### رابعاً: Invoice");
    if(invoice) {
      console.log(`* id: ${invoice.id}`);
      console.log(`* dealId: ${invoice.dealId}`);
      console.log(`* invoiceNumber: ${invoice.invoiceNumber}`);
      console.log(`* status: ${invoice.status}`);
    } else {
      console.log(`* Invoice NOT FOUND for dealId ${deal.id}`);
    }

    console.log("\n### خامساً: CommissionTransaction");
    if(commission) {
      console.log(`* id: ${commission.id}`);
      console.log(`* sellerId: ${commission.sellerId}`);
      console.log(`* dealId: ${commission.dealId}`);
      console.log(`* amount: ${commission.amount}`);
    } else {
      console.log(`* CommissionTransaction NOT FOUND for dealId ${deal.id}`);
    }

    console.log("\n### سادساً: Notification");
    if (notifications.length > 0) {
      notifications.forEach((n, i) => {
        console.log(`[Notification ${i+1}]`);
        console.log(`* id: ${n.id}`);
        console.log(`* recipientId: ${n.recipientId || n.userId}`); // depending on what field actually got saved
        console.log(`* type: ${n.type || n.entityType}`);
      });
    } else {
      console.log("* No notifications found");
    }

  } catch (error) {
    console.error("Verification failed:");
    console.error(error);
  } finally {
    process.exit(0);
  }
}

runVerification();
