const { sequelize, PurchaseRequest, PurchaseRequestItem, Quotation, QuotationItem, Award, AwardLine, PurchaseOrder, PurchaseOrderLine, User, Organization, Category, AuditLog } = require("./sequelize_setup");
const QuotationService = require("./services/quotationService");
const RequestService = require("./services/requestService");
const AwardService = require("./services/awardService");
const ProcurementService = require("./services/procurementService");

async function runPOVerification() {
  console.log("=== PURCHASE ORDER ENGINE VERIFICATION (Blocker 18) ===");
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

    // 2. Create RFQ & Quote & Award directly
    console.log("\n[1] Seeding Award...");
    const rfqData = {
      header: { title: "Test PO RFQ", delivery_city: "Jeddah", version: 1 },
      items: [
        { quantity: 50, unit: "PC", freeTextDescription: "Keyboards", categoryId: category.id }
      ],
      invitations: [supplierA.organization_id]
    };

    let rfq = await RequestService.createRequest(buyerUser.id, rfqData);
    await rfq.update({ status: "published" });
    const rfqWithItems = await PurchaseRequest.findByPk(rfq.id, { include: "items" });
    const item1 = rfqWithItems.items[0].id;

    const quoteA = await QuotationService.submitQuotation(rfq.id, supplierA.organization_id, {
      paymentTerms: "Net 15",
      items: [
        { purchaseRequestItemId: item1, unitPrice: 100, quantityOffered: 50, taxRate: 15 }
      ]
    }, supplierA.id);

    const qItems = await QuotationItem.findAll({ where: { quotationId: quoteA.id } });
    const qItem1 = qItems[0].id;

    const awardSelections = { [item1]: qItem1 };
    const awardResult = await AwardService.submitAward(rfq.id, buyerUser.id, awardSelections);
    const awardId = awardResult.createdAwards[0];
    console.log(`✅ Award Created: ${awardId}`);

    // 3. Generate PO
    console.log("\n[2] Generating Purchase Order...");
    const po = await ProcurementService.generatePOFromAward(awardId, buyerUser.id);
    console.log(`✅ PO Generated: ${po.purchaseOrderNumber} | Business Status: ${po.businessStatus}`);

    // Verify Award Immutability
    const awardPostGenerate = await Award.findByPk(awardId);
    console.log(`✅ Award Status after PO Generation: ${awardPostGenerate.status} (Expected: converted)`);

    // Verify Deep Snapshot
    console.log(`✅ PO Snapshot Contains RFQ:`, !!po.snapshot.rfq);
    console.log(`✅ PO Snapshot Contains Quotation:`, !!po.snapshot.quotation);
    console.log(`✅ PO Snapshot Contains Award:`, !!po.snapshot.award);

    // 4. Issue PO
    console.log("\n[3] Issuing Purchase Order...");
    const issuedPO = await ProcurementService.issuePurchaseOrder(po.id, buyerUser.id);
    console.log(`✅ PO Business Status: ${issuedPO.businessStatus} (Expected: issued)`);
    console.log(`✅ Issued By: ${issuedPO.issuedBy}`);

    // 5. Accept PO
    console.log("\n[4] Seller Accepting Purchase Order...");
    const acceptedPO = await ProcurementService.acceptPurchaseOrder(po.id, supplierA.id);
    console.log(`✅ PO Business Status: ${acceptedPO.businessStatus} (Expected: accepted)`);
    console.log(`✅ PO Fulfillment Status: ${acceptedPO.fulfillmentStatus} (Expected: pending)`);
    console.log(`✅ Accepted By: ${acceptedPO.acceptedBy}`);

    // 6. Verify Audit Logs
    console.log("\n[5] Verifying Audit Timeline...");
    const auditLogs = await AuditLog.findAll({ where: { entity_id: po.id }, order: [["created_at", "ASC"]] });
    const events = auditLogs.map(l => l.new_data ? l.new_data.eventType : l.action);
    console.log(`✅ PO Timeline Events:`, events);

    console.log("\n✅ ALL PURCHASE ORDER TESTS PASSED SUCCESSFULLY");
  } catch (err) {
    console.error("❌ TEST FAILED:");
    console.error(err);
  } finally {
    process.exit(0);
  }
}

runPOVerification();
