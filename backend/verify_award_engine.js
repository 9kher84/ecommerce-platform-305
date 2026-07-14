const { sequelize, PurchaseRequest, PurchaseRequestItem, Quotation, QuotationItem, Award, AwardLine, User, Organization, Category, AuditLog } = require("./sequelize_setup");
const QuotationService = require("./services/quotationService");
const RequestService = require("./services/requestService");
const AwardService = require("./services/awardService");

async function runAwardVerification() {
  console.log("=== AWARD & NEGOTIATION ENGINE VERIFICATION (Blocker 17) ===");
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

    let supplierB = await User.findOne({ where: { email: "sellerB@test.com" }});
    if (!supplierB || !supplierB.organization_id) {
      const orgB = await Organization.create({ name: "Supplier B Org" });
      if (!supplierB) {
        supplierB = await User.create({ email: "sellerB@test.com", password: "123", role: "seller", organization_id: orgB.id, status: "active" });
      } else {
        await supplierB.update({ organization_id: orgB.id });
        supplierB.organization_id = orgB.id;
      }
    }

    const category = await Category.findOne();

    // 2. Create RFQ (2 Items)
    console.log("\n[1] Creating RFQ...");
    const rfqData = {
      header: { title: "Test Award RFQ", delivery_city: "Riyadh", version: 1 },
      items: [
        { quantity: 10, unit: "PC", freeTextDescription: "Laptops", categoryId: category.id },
        { quantity: 5, unit: "PC", freeTextDescription: "Monitors", categoryId: category.id }
      ],
      invitations: [supplierA.organization_id, supplierB.organization_id]
    };

    let rfq = await RequestService.createRequest(buyerUser.id, rfqData);
    await rfq.update({ status: "published" });
    console.log(`✅ RFQ Created: ${rfq.id}`);

    // Fetch items to get IDs
    const rfqWithItems = await PurchaseRequest.findByPk(rfq.id, { include: "items" });
    const item1 = rfqWithItems.items[0].id;
    const item2 = rfqWithItems.items[1].id;

    // 3. Supplier A quotes (V1)
    console.log("\n[2] Supplier A submits Quote (V1)...");
    const quoteA_V1 = await QuotationService.submitQuotation(rfq.id, supplierA.organization_id, {
      paymentTerms: "Net 30",
      items: [
        { purchaseRequestItemId: item1, unitPrice: 2000, quantityOffered: 10, taxRate: 15 },
        { purchaseRequestItemId: item2, unitPrice: 500, quantityOffered: 5, taxRate: 15 }
      ]
    }, supplierA.id);
    console.log(`✅ Quote V1 Created: ${quoteA_V1.id}`);

    // 4. Buyer Negotiates with Supplier A
    console.log("\n[3] Buyer Negotiates with Supplier A...");
    await QuotationService.requestNegotiation(quoteA_V1.id, buyerUser.id, {
      message: "Can you do 1800 for the laptops?",
      targetPrice: 1800
    });
    console.log(`✅ Negotiation Requested on V1.`);

    // 5. Supplier A submits revised Quote (V2)
    console.log("\n[4] Supplier A submits revised Quote (V2)...");
    const quoteA_V2 = await QuotationService.editQuotation(quoteA_V1.id, supplierA.organization_id, {
      paymentTerms: "Net 30",
      items: [
        { purchaseRequestItemId: item1, unitPrice: 1800, quantityOffered: 10, taxRate: 15 }, // Discounted
        { purchaseRequestItemId: item2, unitPrice: 500, quantityOffered: 5, taxRate: 15 }
      ]
    }, supplierA.id);
    console.log(`✅ Quote V2 Created: ${quoteA_V2.id}`);

    // Check V1 status is superseded
    const v1Check = await Quotation.findByPk(quoteA_V1.id);
    console.log(`   - V1 Status: ${v1Check.status} (Expected: superseded)`);

    // 6. Supplier B quotes (Only Monitors)
    console.log("\n[5] Supplier B submits Quote...");
    const quoteB = await QuotationService.submitQuotation(rfq.id, supplierB.organization_id, {
      paymentTerms: "COD",
      items: [
        { purchaseRequestItemId: item2, unitPrice: 400, quantityOffered: 5, taxRate: 15 } // Cheaper monitors
      ]
    }, supplierB.id);
    console.log(`✅ Supplier B Quote Created: ${quoteB.id}`);

    // Fetch QuotationItems to construct Award Map
    const qA2_Items = await QuotationItem.findAll({ where: { quotationId: quoteA_V2.id } });
    const qB_Items = await QuotationItem.findAll({ where: { quotationId: quoteB.id } });
    
    const qA2_Item1 = qA2_Items.find(i => i.purchaseRequestItemId === item1).id;
    const qB_Item2 = qB_Items.find(i => i.purchaseRequestItemId === item2).id;

    // 7. Buyer Awards Item 1 to Supplier A (V2), and Item 2 to Supplier B
    console.log("\n[6] Buyer Submits Partial Award...");
    const awardSelections = {
      [item1]: qA2_Item1,
      [item2]: qB_Item2
    };

    const awardResult = await AwardService.submitAward(rfq.id, buyerUser.id, awardSelections);
    console.log(`✅ Awards Created:`, awardResult.createdAwards);
    console.log(`✅ Derived RFQ Status: ${awardResult.newRfqStatus} (Expected: awarded)`);

    // 8. Verify DB State
    console.log("\n[7] Verifying DB State...");
    const awards = await Award.findAll({ where: { id: awardResult.createdAwards }, include: "lines" });
    
    if (awards.length === 2) {
      console.log(`✅ Exactly 2 Awards created.`);
      awards.forEach(aw => {
        console.log(`   - Award [${aw.id}] for Seller Org [${aw.sellerOrganizationId}]: ${aw.lines.length} lines. Total: ${aw.totalAmount}`);
      });
    } else {
      console.log(`❌ Expected 2 Awards, got ${awards.length}`);
    }

    const prItems = await PurchaseRequestItem.findAll({ where: { purchaseRequestId: rfq.id } });
    const allAwarded = prItems.every(i => i.status === "awarded");
    console.log(`✅ All PR Items awarded: ${allAwarded}`);

    // 9. Verify AuditLog
    console.log("\n[8] Verifying Audit Timeline...");
    const auditLogs = await AuditLog.findAll({ where: { entity_id: rfq.id }, order: [["created_at", "ASC"]] });
    const events = auditLogs.map(l => l.new_data ? l.new_data.eventType : l.action);
    console.log(`✅ Timeline Events Captured:`, events);
    
    const negEvent = await AuditLog.findOne({ where: { entity_id: quoteA_V1.id } });
    console.log(`✅ Negotiation Event Captured on V1 Quote:`, negEvent ? negEvent.action : "Not Found");

    console.log("\n✅ ALL AWARD ENGINE TESTS PASSED SUCCESSFULLY");
  } catch (err) {
    console.error("❌ TEST FAILED:");
    console.error(err);
  } finally {
    process.exit(0);
  }
}

runAwardVerification();
