const { 
  sequelize, 
  PurchaseOrder, 
  PurchaseOrderLine, 
  Award, 
  User, 
  Organization,
  OrganizationUser,
  Receipt, 
  ReceiptLine, 
  Invoice, 
  InvoiceLine 
} = require("../sequelize_setup");
const BillingService = require("../services/billing/BillingService");

async function runE2EPipelineVerification() {
  console.log("\n===========================================================");
  console.log("🧪 RUNNING E2E B2B CANONICAL PIPELINE VERIFICATION");
  console.log("===========================================================\n");

  const timestamp = Date.now();
  let buyerUser, sellerUser;
  let buyerOrg, sellerOrg;
  let prId, prItemId, quotationId, quotationItemId, awardId, poId, poLineId, receiptId, receiptLineId;
  let createdInvoice = null;

  try {
    // -------------------------------------------------------------
    // STAGE 1: Purchase Request Creation
    // -------------------------------------------------------------
    console.log("▶ STAGE 1: Creating Purchase Request...");
    buyerOrg = await Organization.create({ name: `E2E Buyer Org ${timestamp}` });
    sellerOrg = await Organization.create({ name: `E2E Seller Org ${timestamp}` });

    sellerUser = await User.create({
      email: `e2e_seller_${timestamp}@example.com`,
      password: "hashedpassword123",
      role: "seller"
    });

    await OrganizationUser.create({
      organization_id: sellerOrg.id,
      user_id: sellerUser.id,
      is_primary: true,
      status: "active"
    });

    buyerUser = await User.create({
      email: `e2e_buyer_${timestamp}@example.com`,
      password: "hashedpassword123",
      role: "buyer"
    });

    prId = `00000000-0000-0000-0000-${timestamp.toString().slice(-12)}`;
    await sequelize.query(
      `INSERT INTO "PurchaseRequests" (id, title, status, "userId", "createdAt", "updatedAt") VALUES (:id, 'E2E Test PR', 'published', :userId, NOW(), NOW())`,
      { replacements: { id: prId, userId: buyerUser.id } }
    );

    prItemId = `00000000-0000-0000-0000-${timestamp.toString().slice(-12)}`;
    await sequelize.query(
      `INSERT INTO "PurchaseRequestItems" (id, "purchaseRequestId", "lineNumber", quantity, unit, "createdAt", "updatedAt") VALUES (:id, :prId, 1, 100, 'pcs', NOW(), NOW())`,
      { replacements: { id: prItemId, prId } }
    );

    console.log(`  [PASS] Purchase Request created ID: ${prId}`);

    // -------------------------------------------------------------
    // STAGE 2: Quotation Submission
    // -------------------------------------------------------------
    console.log("\n▶ STAGE 2: Submitting Seller Quotation...");
    quotationId = `00000000-0000-0000-0000-${timestamp.toString().slice(-12)}`;
    await sequelize.query(
      `INSERT INTO "Quotations" (id, "purchaseRequestId", "sellerOrganizationId", "createdAt", "updatedAt") VALUES (:id, :prId, :sellerOrgId, NOW(), NOW())`,
      { replacements: { id: quotationId, prId, sellerOrgId: sellerOrg.id } }
    );

    quotationItemId = `00000000-0000-0000-0000-${timestamp.toString().slice(-12)}`;
    await sequelize.query(
      `INSERT INTO "QuotationItems" (id, "quotationId", "purchaseRequestItemId", "unitPrice", "quantityOffered", "createdAt", "updatedAt") VALUES (:id, :qId, :priId, 15, 100, NOW(), NOW())`,
      { replacements: { id: quotationItemId, qId: quotationId, priId: prItemId } }
    );

    console.log(`  [PASS] Quotation submitted ID: ${quotationId}`);

    // -------------------------------------------------------------
    // STAGE 3: Award Acceptance
    // -------------------------------------------------------------
    console.log("\n▶ STAGE 3: Accepting Award...");
    const award = await Award.create({
      purchaseRequestId: prId,
      quotationId: quotationId,
      buyerOrganizationId: buyerOrg.id,
      sellerOrganizationId: sellerOrg.id,
      status: "accepted",
      totalAmount: 1500
    });
    awardId = award.id;

    const { AwardLine } = require("../sequelize_setup");
    const awardLine = await AwardLine.create({
      awardId: awardId,
      sellerOrganizationId: sellerOrg.id,
      quotationItemId: quotationItemId,
      purchaseRequestItemId: prItemId,
      quantityAwarded: 100,
      unitPriceAwarded: 15,
      totalPrice: 1500,
      snapshot: { item: "E2E Industrial Item" }
    });
    console.log(`  [PASS] Award & AwardLine accepted ID: ${awardId}`);

    // -------------------------------------------------------------
    // STAGE 4: Purchase Order Generation & Acceptance
    // -------------------------------------------------------------
    console.log("\n▶ STAGE 4: Generating & Accepting Purchase Order...");
    const po = await PurchaseOrder.create({
      purchaseOrderNumber: `PO-E2E-${timestamp}`,
      awardId: awardId,
      buyerId: buyerUser.id,
      sellerOrganizationId: sellerOrg.id,
      businessStatus: "accepted",
      fulfillmentStatus: "partially_received",
      snapshot: { award: { totalAmount: 1500 } }
    });
    poId = po.id;

    const poLine = await PurchaseOrderLine.create({
      purchaseOrderId: poId,
      awardLineId: awardLine.id,
      quantity: 100,
      unitPrice: 15,
      snapshot: { name: "E2E Industrial Item" }
    });
    poLineId = poLine.id;
    console.log(`  [PASS] PO generated & accepted ID: ${poId}`);

    // -------------------------------------------------------------
    // STAGE 5: Fulfillment & Goods Receipt Inspection
    // -------------------------------------------------------------
    console.log("\n▶ STAGE 5: Recording & Accepting Goods Receipt...");
    const receipt = await Receipt.create({
      purchaseOrderId: poId,
      buyerId: buyerUser.id,
      status: "accepted"
    });
    receiptId = receipt.id;

    const receiptLine = await ReceiptLine.create({
      receiptId: receiptId,
      purchaseOrderLineId: poLineId,
      acceptedQuantity: 80,
      damagedQuantity: 5,
      rejectedQuantity: 15
    });
    receiptLineId = receiptLine.id;
    console.log(`  [PASS] Goods Receipt accepted (80 Accepted, 5 Damaged, 15 Rejected). ID: ${receiptId}`);

    // -------------------------------------------------------------
    // STAGE 6: Invoice Eligibility Evaluation (B2B Boundary)
    // -------------------------------------------------------------
    console.log("\n▶ STAGE 6: Checking B2B Invoice Eligibility...");
    const eligibility = await BillingService.getInvoiceEligibility(poId);
    console.log("  Eligibility Output:", JSON.stringify(eligibility, null, 2));

    if (eligibility.totalEligibleAmount !== 1200) {
      throw new Error(`E2E Failure: Expected eligible amount 1200, got ${eligibility.totalEligibleAmount}`);
    }
    console.log("  [PASS] Invoice Eligibility evaluated cleanly (80 units eligible @ 15 SAR = 1200 SAR)");

    // -------------------------------------------------------------
    // STAGE 7: B2B Commercial Invoice Issuance
    // -------------------------------------------------------------
    console.log("\n▶ STAGE 7: Issuing B2B Commercial Invoice...");
    createdInvoice = await BillingService.issueInvoiceFromPO(
      poId,
      [{ purchaseOrderLineId: poLineId, quantity: 80 }],
      buyerUser.id
    );

    console.log(`  [PASS] Commercial Invoice issued successfully! ID: ${createdInvoice.id}, Invoice #: ${createdInvoice.invoiceNumber}, Total: ${createdInvoice.totalAmount}`);

    // -------------------------------------------------------------
    // STAGE 8: Post-Issuance Over-Invoicing Protection Guard Check
    // -------------------------------------------------------------
    console.log("\n▶ STAGE 8: Verifying Over-Invoicing Rejection Guard...");
    try {
      await BillingService.issueInvoiceFromPO(
        poId,
        [{ purchaseOrderLineId: poLineId, quantity: 1 }],
        buyerUser.id
      );
      throw new Error("E2E FAILURE: Over-invoicing should have been rejected!");
    } catch (err) {
      if (err.statusCode === 400 && err.message.includes("Billing invariant violated")) {
        console.log(`  [PASS] Over-invoicing rejected cleanly with HTTP 400: "${err.message}"`);
      } else {
        throw err;
      }
    }

    console.log("\n===========================================================");
    console.log("🎉 ALL E2E CANONICAL B2B PIPELINE STAGES PASSED!");
    console.log("===========================================================\n");

  } catch (error) {
    console.error("\n❌ E2E PIPELINE FAILURE:", error);
    process.exit(1);
  } finally {
    // Cleanup
    console.log("🧹 Cleaning up test pipeline data...");
    if (createdInvoice) {
      await InvoiceLine.destroy({ where: { invoiceId: createdInvoice.id }, force: true });
      await Invoice.destroy({ where: { id: createdInvoice.id }, force: true });
    }
    if (receiptLineId) await ReceiptLine.destroy({ where: { id: receiptLineId }, force: true });
    if (receiptId) await Receipt.destroy({ where: { id: receiptId }, force: true });
    if (poLineId) await PurchaseOrderLine.destroy({ where: { id: poLineId }, force: true });
    if (poId) await PurchaseOrder.destroy({ where: { id: poId }, force: true });
    if (awardId) await Award.destroy({ where: { id: awardId }, force: true });
    if (quotationItemId) await sequelize.query(`DELETE FROM "QuotationItems" WHERE id = :id`, { replacements: { id: quotationItemId } });
    if (quotationId) await sequelize.query(`DELETE FROM "Quotations" WHERE id = :id`, { replacements: { id: quotationId } });
    if (prItemId) await sequelize.query(`DELETE FROM "PurchaseRequestItems" WHERE id = :id`, { replacements: { id: prItemId } });
    if (prId) await sequelize.query(`DELETE FROM "PurchaseRequests" WHERE id = :id`, { replacements: { id: prId } });
    if (sellerOrg) {
      await OrganizationUser.destroy({ where: { organization_id: sellerOrg.id }, force: true });
      await Organization.destroy({ where: { id: sellerOrg.id }, force: true });
    }
    if (buyerOrg) await Organization.destroy({ where: { id: buyerOrg.id }, force: true });
    if (sellerUser) await User.destroy({ where: { id: sellerUser.id }, force: true });
    if (buyerUser) await User.destroy({ where: { id: buyerUser.id }, force: true });
    console.log("✅ Cleanup complete.");
  }
}

runE2EPipelineVerification();
