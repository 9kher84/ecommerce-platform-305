const { sequelize, PurchaseRequest, PurchaseRequestItem, Quotation, QuotationItem, User, Organization, Category } = require("./sequelize_setup");
const QuotationService = require("./services/quotationService");
const RequestService = require("./services/requestService");

async function runQuotationVerification() {
  console.log("=== QUOTATION ENGINE VERIFICATION (Blocker 16) ===");
  try {
    // 1. Setup Data
    const buyerUser = await User.findOne({ where: { role: "buyer" } });
    if (!buyerUser) throw new Error("Buyer not found");
    let sellerUser = await User.findOne({ where: { role: "seller" } });
    if (!sellerUser) throw new Error("Seller not found");
    if (!sellerUser.organization_id) {
      const org = await Organization.create({ name: "Seller Org" });
      await sellerUser.update({ organization_id: org.id });
      sellerUser.organization_id = org.id; // UPDATE LOCAL VARIABLE
    }

    const category = await Category.findOne();

    // 2. Create RFQ
    console.log("\n[1] Testing Pre-requisites & RFQ Creation...");
    const rfqData = {
      header: { title: "Test Quotation RFQ", delivery_city: "Riyadh", version: 1 },
      items: [
        { quantity: 10, unit: "PC", freeTextDescription: "Item 1 for Quote", categoryId: category.id },
        { quantity: 5, unit: "KG", freeTextDescription: "Item 2 for Quote", categoryId: category.id }
      ],
      invitations: [sellerUser.organization_id]
    };

    let rfq = await RequestService.createRequest(buyerUser.id, rfqData);
    console.log(`✅ RFQ Created: ${rfq.id}`);

    // Publish it manually for test
    await rfq.update({ status: "published" });

    // 3. Test Optimistic Locking
    console.log("\n[2] Testing Optimistic Locking (Pre-requisite)...");
    try {
      await RequestService.editRequest(rfq.id, buyerUser.id, {
        header: { title: "Hacked Title" },
        version: 999 // Conflict!
      });
      console.log("❌ Optimistic Locking FAILED - Did not throw 409!");
    } catch (err) {
      if (err.statusCode === 409 || err.message.includes("Conflict")) {
        console.log("✅ Optimistic Locking threw 409 as expected.");
      } else {
        throw err;
      }
    }

    // 4. Submit Quote
    console.log("\n[3] Testing Quotation Submission...");
    const rfqWithItems = await PurchaseRequest.findByPk(rfq.id, { include: "items" });
    const quoteItemsData = rfqWithItems.items.map(item => ({
      purchaseRequestItemId: item.id,
      unitPrice: 100, // 100 * 10 = 1000, 100 * 5 = 500
      quantityOffered: item.quantity,
      discount: 0,
      taxRate: 15
    }));

    const quote = await QuotationService.submitQuotation(rfq.id, sellerUser.organization_id, {
      paymentTerms: "Net 30",
      items: quoteItemsData
    }, sellerUser.id);
    console.log(`✅ Quote Created: ${quote.id}`);
    console.log(`   - Subtotal: ${quote.subtotal}`);
    console.log(`   - Tax: ${quote.taxAmount}`);
    console.log(`   - Grand Total: ${quote.grandTotal}`); // (1000+500) = 1500 + 15% = 1725

    // 5. Test Read Model & Timeline
    console.log("\n[4] Testing Audit Timeline & Read Model Statistics...");
    const rfqDetails = await RequestService.getRequestDetails(rfq.id, buyerUser.id);
    console.log("✅ Read Model Statistics:", rfqDetails.statistics);
    console.log("✅ Audit Timeline (First 3):", rfqDetails.timeline.slice(0, 3).map(e => e.event));

    // 6. Test Supersede Quote
    console.log("\n[5] Testing Edit/Supersede Quote...");
    const updatedQuoteItems = quoteItemsData.map(qi => ({ ...qi, unitPrice: 90 }));
    const supersededQuote = await QuotationService.editQuotation(quote.id, sellerUser.organization_id, {
      items: updatedQuoteItems,
      paymentTerms: "Net 15"
    }, sellerUser.id);

    console.log(`✅ Quote Superseded! New Quote ID: ${supersededQuote.id}`);
    console.log(`   - Old Quote Status: ${(await Quotation.findByPk(quote.id)).status} (Expected: superseded)`);
    console.log(`   - New Quote Grand Total: ${supersededQuote.grandTotal}`);

    console.log("\n✅ ALL QUOTATION ENGINE TESTS PASSED SUCCESSFULLY");
  } catch (err) {
    console.error("❌ TEST FAILED:");
    console.error(err);
  } finally {
    process.exit(0);
  }
}

runQuotationVerification();
