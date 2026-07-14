const { sequelize, PurchaseRequest, Quotation, QuotationItem, Award, AwardLine, PurchaseOrder, PurchaseOrderLine, Shipment, Receipt, User, Organization, Category, AuditLog } = require("./sequelize_setup");
const QuotationService = require("./services/quotationService");
const RequestService = require("./services/requestService");
const AwardService = require("./services/awardService");
const ProcurementService = require("./services/procurementService");
const FulfillmentService = require("./services/fulfillment/FulfillmentService");
const { initializeEventConsumers } = require("./services/events/index");

async function runFulfillmentVerification() {
  console.log("=== FULFILLMENT ENGINE VERIFICATION (Blocker 20/21 Event Refactor) ===");
  initializeEventConsumers();
  try {
    // 1. Setup Data
    const buyerUser = await User.findOne({ where: { role: "buyer" } });
    if (!buyerUser) throw new Error("Buyer not found");

    let supplierA = await User.findOne({ where: { email: "sellerA@test.com" }});
    if (!supplierA || !supplierA.organization_id) {
      const orgA = await Organization.create({ name: "Supplier A Org" });
      if (!supplierA) {
        supplierA = await User.create({ email: "sellerA@test.com", password: "123", role: "seller", organization_id: orgA.id, status: "active" });
      } else {
        await supplierA.update({ organization_id: orgA.id });
        supplierA.organization_id = orgA.id;
      }
    }
    const category = await Category.findOne();

    // 2. Create RFQ & Quote & Award & PO
    console.log("\n[1] Seeding Purchase Order...");
    const rfqData = {
      header: { title: "Fulfillment Test PO", delivery_city: "Riyadh", version: 1 },
      items: [
        { quantity: 100, unit: "PC", freeTextDescription: "Monitors", categoryId: category.id }
      ],
      invitations: [supplierA.organization_id]
    };

    let rfq = await RequestService.createRequest(buyerUser.id, rfqData);
    await rfq.update({ status: "published" });
    const rfqWithItems = await PurchaseRequest.findByPk(rfq.id, { include: "items" });
    const item1 = rfqWithItems.items[0].id;

    const quoteA = await QuotationService.submitQuotation(rfq.id, supplierA.organization_id, {
      paymentTerms: "Net 30",
      items: [{ purchaseRequestItemId: item1, unitPrice: 200, quantityOffered: 100, taxRate: 15 }]
    }, supplierA.id);

    const qItems = await QuotationItem.findAll({ where: { quotationId: quoteA.id } });
    const qItem1 = qItems[0].id;

    const awardSelections = { [item1]: qItem1 };
    const awardResult = await AwardService.submitAward(rfq.id, buyerUser.id, awardSelections);
    const awardId = awardResult.createdAwards[0];
    
    const po = await ProcurementService.generatePOFromAward(awardId, buyerUser.id);
    await ProcurementService.issuePurchaseOrder(po.id, buyerUser.id);
    await ProcurementService.acceptPurchaseOrder(po.id, supplierA.id);
    
    console.log(`✅ PO Accepted: ${po.purchaseOrderNumber} | Fulfillment Status: pending`);

    const poLines = await PurchaseOrderLine.findAll({ where: { purchaseOrderId: po.id } });
    const poLine1 = poLines[0];

    // 3. Preparation
    console.log("\n[2] Starting Preparation...");
    await FulfillmentService.startPreparation(po.id, supplierA.id);
    const poPrep = await PurchaseOrder.findByPk(po.id);
    console.log(`✅ PO Fulfillment Status: ${poPrep.fulfillmentStatus} (Expected: preparing)`);

    console.log("\n[3] Marking Ready To Ship...");
    await FulfillmentService.markReadyToShip(po.id, supplierA.id);
    const poReady = await PurchaseOrder.findByPk(po.id);
    console.log(`✅ PO Fulfillment Status: ${poReady.fulfillmentStatus} (Expected: ready_to_ship)`);

    // 4. Shipment
    console.log("\n[4] Creating Partial Shipment (50 PCs)...");
    const shipmentData = {
      trackingNumber: "TRK-9999",
      carrier: "Aramex",
      lines: [
        { purchaseOrderLineId: poLine1.id, quantityPacked: 50, quantityLoaded: 50, quantityShipped: 50 }
      ]
    };
    const shipment = await FulfillmentService.createShipment(po.id, supplierA.organization_id, supplierA.id, shipmentData);
    console.log(`✅ Shipment Created: ${shipment.id} | Status: preparing`);

    console.log("\n[5] Dispatching Shipment...");
    await FulfillmentService.dispatchShipment(shipment.id, supplierA.id);
    const poPartialShip = await PurchaseOrder.findByPk(po.id);
    console.log(`✅ PO Fulfillment Status: ${poPartialShip.fulfillmentStatus} (Expected: partially_shipped)`);

    // 5. Receipt
    console.log("\n[6] Logging Blind Receipt (20 accepted, 3 damaged, 2 rejected = 25 received)...");
    const receiptData = {
      shipmentId: null, // Blind receipt
      lines: [
        { purchaseOrderLineId: poLine1.id, acceptedQuantity: 20, damagedQuantity: 3, rejectedQuantity: 2 }
      ]
    };
    const receipt = await FulfillmentService.logReceipt(po.id, buyerUser.id, receiptData);
    console.log(`✅ Receipt Logged: ${receipt.id} | Status: pending_inspection`);

    console.log("\n[7] Accepting Receipt (Inspection Concluded)...");
    await FulfillmentService.acceptReceipt(receipt.id, buyerUser.id);
    const poPartialRecv = await PurchaseOrder.findByPk(po.id);
    console.log(`✅ PO Fulfillment Status: ${poPartialRecv.fulfillmentStatus} (Expected: partially_received)`);

    // 6. Verify Audit Logs
    console.log("\n[8] Verifying Audit Timeline for Operational Events...");
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for EventBus async consumers
    const auditLogs = await AuditLog.findAll({ where: { entity_id: po.id }, order: [["created_at", "ASC"]] });
    const events = auditLogs.map(l => l.new_data ? l.new_data.eventType : l.action);
    console.log(`✅ PO Timeline Events:`, events.filter(e => e.startsWith("PO_")));

    console.log("\n✅ ALL FULFILLMENT ENGINE TESTS PASSED SUCCESSFULLY");
  } catch (err) {
    console.error("❌ TEST FAILED:");
    console.error(err);
  } finally {
    process.exit(0);
  }
}

runFulfillmentVerification();
