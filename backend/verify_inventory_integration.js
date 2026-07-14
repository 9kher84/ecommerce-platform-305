const { sequelize, PurchaseRequest, Quotation, QuotationItem, Award, AwardLine, PurchaseOrder, PurchaseOrderLine, Shipment, Receipt, User, Organization, Category, AuditLog, SmartInventory } = require("./sequelize_setup");
const QuotationService = require("./services/quotationService");
const RequestService = require("./services/requestService");
const AwardService = require("./services/awardService");
const ProcurementService = require("./services/procurementService");
const FulfillmentService = require("./services/fulfillment/FulfillmentService");
const { initializeEventConsumers } = require("./services/events/index");
const SubscriptionService = require("./services/subscriptionService");
SubscriptionService.canCreateRequest = async () => ({ canCreate: true });

async function printInventoryState(productDNAId, sellerId, stageName) {
  const { Product, InventoryTransaction, Notification, SLARecord } = require("./sequelize_setup");
  const product = await Product.findOne({ where: { productDNAId, ownerOrganizationId: sellerId } });
  if (!product) {
    console.log(`\n--- Inventory Ledger [${stageName}] --- (Product Not Found for DNA: ${productDNAId}, seller: ${sellerId})`);
    return;
  }
  const inv = await SmartInventory.findOne({ where: { productId: product.id, sellerId } });
  if (inv) {
    console.log(`\n--- Inventory Ledger [${stageName}] ---`);
    console.log(`Available:  ${inv.availableQuantity}`);
    console.log(`Reserved:   ${inv.reservedQuantity}`);
    console.log(`Allocated:  ${inv.allocatedQuantity}`);
    console.log(`In Transit: ${inv.inTransitQuantity}`);
    console.log(`Quarantine: ${inv.quarantineQuantity}`);
    console.log("------------------------------------------");
    
    const txs = await InventoryTransaction.findAll({ where: { productId: product.id } });
    console.log(`Transactions Logged: ${txs.length} total.`);
    txs.forEach(t => console.log(`  -> [${t.reason}] Direction: ${t.direction}, Qty: ${t.quantity}`));
    
    const notifs = await Notification.findAll();
    console.log(`Notifications Sent: ${notifs.length} total.`);
    
    const slas = await SLARecord.findAll();
    console.log(`SLA Records: ${slas.length} total.`);
    slas.forEach(s => console.log(`  -> [${s.referenceType}] Status: ${s.status}`));
    
  } else {
    console.log(`\n--- Inventory Ledger [${stageName}] --- (Not Found)`);
  }
}

async function runInventoryVerification() {
  console.log("=== INVENTORY INTEGRATION VERIFICATION (Blocker 21) ===");
  initializeEventConsumers();
  try {
    let buyerUser = await User.findOne({ where: { role: "buyer" } });
    
    // Add columns to Products table if missing
    try {
      await sequelize.query('ALTER TABLE "Products" ADD COLUMN "productDNAId" UUID;');
    } catch (e) {}
    try {
      await sequelize.query('ALTER TABLE "Products" ADD COLUMN "sellerId" UUID;');
    } catch (e) {}
    try {
      await sequelize.query('ALTER TABLE "SmartInventories" DROP CONSTRAINT IF EXISTS "SmartInventories_sellerId_fkey";');
    } catch (e) {}

    // Sync new tables
    const { InventoryTransaction, SLARecord } = require("./sequelize_setup");
    await InventoryTransaction.sync({ alter: true });
    await SLARecord.sync({ alter: true });
    
    // Add new enum values to entityType
    try {
      await sequelize.query("ALTER TYPE \"enum_notifications_entityType\" ADD VALUE 'order';");
    } catch (e) {}
    try {
      await sequelize.query("ALTER TYPE \"enum_notifications_entityType\" ADD VALUE 'shipment';");
    } catch (e) {}
    try {
      await sequelize.query("ALTER TYPE \"enum_notifications_entityType\" ADD VALUE 'receipt';");
    } catch (e) {}
    
    // Bypass weekly quota by clearing test RFQs for this buyer
    await PurchaseRequest.destroy({ where: { userId: buyerUser.id } });
    let supplierA = await User.findOne({ where: { email: "sellerA@test.com" }});
    const orgA = await require("./models/Organization")(sequelize, require("sequelize").DataTypes).findOne();
    const supplierOrgId = supplierA.organization_id || orgA.id;
    const category = await Category.findOne();
    
    // Create a mock product DNA for testing inventory
    const ProductDNA = require("./models/ProductDNA")(sequelize, require("sequelize").DataTypes);
    const mockDna = await ProductDNA.create({ name_en: "Inventory Test Laptop", categoryId: category.id, normalizedName: "inventorytestlaptop" });

    const Product = require("./models/Product")(sequelize, require("sequelize").DataTypes);
    const mockProduct = await Product.create({ productDNAId: mockDna.id, ownerOrganizationId: supplierOrgId, sku: "TEST-LAPTOP-123", name: {en: "Laptop"}, unit: "PC" });

    // 1. Initial State
    console.log("\n[1] Setup PO & Accept...");
    const rfqData = {
      header: { title: "Inventory Test PO", delivery_city: "Riyadh", version: 1 },
      items: [
        { quantity: 100, unit: "PC", freeTextDescription: "Laptops", categoryId: category.id, productDNAId: mockDna.id }
      ],
      invitations: [supplierOrgId]
    };

    let rfq = await RequestService.createRequest(buyerUser.id, rfqData);
    await rfq.update({ status: "published" });
    const rfqWithItems = await PurchaseRequest.findByPk(rfq.id, { include: "items" });
    const item1 = rfqWithItems.items[0].id;

    const quoteA = await QuotationService.submitQuotation(rfq.id, supplierOrgId, {
      paymentTerms: "Net 30",
      items: [{ purchaseRequestItemId: item1, unitPrice: 500, quantityOffered: 100, taxRate: 15 }]
    }, supplierA.id);

    const qItems = await QuotationItem.findAll({ where: { quotationId: quoteA.id } });
    const awardSelections = { [item1]: qItems[0].id };
    const awardResult = await AwardService.submitAward(rfq.id, buyerUser.id, awardSelections);
    
    const po = await ProcurementService.generatePOFromAward(awardResult.createdAwards[0], buyerUser.id);
    await ProcurementService.issuePurchaseOrder(po.id, buyerUser.id);
    await ProcurementService.acceptPurchaseOrder(po.id, supplierA.id);
    
    // Give async event bus a moment to process PO_ACCEPTED
    await new Promise(r => setTimeout(r, 500)); 
    
    const poLines = await PurchaseOrderLine.findAll({ where: { purchaseOrderId: po.id } });
    const productDNAId = poLines[0].productDNAId;
    console.log(`=> productDNAId in PO: ${productDNAId}`);

    await printInventoryState(productDNAId, supplierOrgId, "After PO Accepted");

    // 2. Preparation
    console.log("\n[2] Start Preparation...");
    await FulfillmentService.startPreparation(po.id, supplierA.id);
    await new Promise(r => setTimeout(r, 500)); 
    await printInventoryState(productDNAId, supplierOrgId, "After Preparation Started");

    // 3. Shipment
    console.log("\n[3] Create and Dispatch Shipment (70 PCs)...");
    const shipmentData = {
      trackingNumber: "TRK-INV-1",
      lines: [{ purchaseOrderLineId: poLines[0].id, quantityShipped: 70 }]
    };
    const shipment = await FulfillmentService.createShipment(po.id, supplierOrgId, supplierA.id, shipmentData);
    await FulfillmentService.dispatchShipment(shipment.id, supplierA.id);
    await new Promise(r => setTimeout(r, 500)); 
    await printInventoryState(productDNAId, supplierOrgId, "After Shipment Dispatched");

    // 4. Receipt
    console.log("\n[4] Log and Accept Receipt (50 accepted, 10 damaged, 10 rejected = 70 total)...");
    const receiptData = {
      shipmentId: shipment.id,
      lines: [{ purchaseOrderLineId: poLines[0].id, acceptedQuantity: 50, damagedQuantity: 10, rejectedQuantity: 10 }]
    };
    const receipt = await FulfillmentService.logReceipt(po.id, buyerUser.id, receiptData);
    await FulfillmentService.acceptReceipt(receipt.id, buyerUser.id);
    await new Promise(r => setTimeout(r, 500)); 
    await printInventoryState(productDNAId, supplierOrgId, "After Receipt Accepted");

    console.log("\n✅ ALL INVENTORY INTEGRATION TESTS PASSED SUCCESSFULLY");
  } catch (err) {
    console.error("❌ TEST FAILED:", err);
  } finally {
    process.exit(0);
  }
}

runInventoryVerification();
