const {
  sequelize,
  PurchaseRequest,
  PurchaseRequestItem,
  PurchaseRequestInvitation,
  Quotation,
  QuotationItem,
  ProductDNA,
  Category,
  Organization,
  User,
} = require("./sequelize_setup");

async function runVerification() {
  console.log("=== RFQ MULTI-LINE MODEL VERIFICATION ===");
  try {
    // 1. Setup Data
    const buyerOrg = await Organization.findOne() || await Organization.create({ name: "Buyer Org" });
    const sellerOrg = await Organization.findOne({ where: { id: { [require('sequelize').Op.ne]: buyerOrg.id } } }) 
      || await Organization.create({ name: "Seller Org" });
    const user = await User.findOne({ where: { role: "buyer" } }) 
      || await User.create({ name: "Test Buyer", email: `buyer-${Date.now()}@test.com`, role: "buyer" });
    const category = await Category.findOne() || await Category.create({ name: "Steel", enName: "Steel" });
    
    // Create a mock ProductDNA
    let productDNA = await ProductDNA.findOne();
    if (!productDNA) {
      productDNA = await ProductDNA.create({
        normalizedName: "Steel Rebar 12mm Test",
        categoryId: category.id,
        status: "active",
      });
    }

    // 2. Create RFQ Header
    console.log("[1] Creating RFQ Header...");
    const rfq = await PurchaseRequest.create({
      title: "Massive B2B Construction Material Request",
      buyerId: user.id,
      organization_id: buyerOrg.id,
      status: "published",
      delivery_city: "Riyadh",
    });
    console.log(" - RFQ Created:", rfq.id);

    // 3. Create RFQ Items (3 types)
    console.log("[2] Creating RFQ Items (Multi-line)...");
    const item1 = await PurchaseRequestItem.create({
      purchaseRequestId: rfq.id,
      lineNumber: 1,
      productDNAId: productDNA.id, // Case 1: Known product
      quantity: 100,
      unit: "ton",
    });
    const item2 = await PurchaseRequestItem.create({
      purchaseRequestId: rfq.id,
      lineNumber: 2,
      categoryId: category.id, // Case 2: Known category only
      freeTextDescription: "Cement 50kg bags",
      quantity: 500,
      unit: "bag",
    });
    const item3 = await PurchaseRequestItem.create({
      purchaseRequestId: rfq.id,
      lineNumber: 3,
      freeTextDescription: "High pressure water pump 8 bar", // Case 3: Free text only
      quantity: 2,
      unit: "piece",
    });
    console.log(" - Items Created:", [item1.id, item2.id, item3.id]);

    // 4. Create Invitation
    console.log("[3] Creating RFQ Invitation...");
    const invitation = await PurchaseRequestInvitation.create({
      purchaseRequestId: rfq.id,
      sellerOrganizationId: sellerOrg.id,
      status: "pending",
    });
    console.log(" - Invitation Created:", invitation.id);

    // 5. Create Quotation (Header)
    console.log("[4] Seller submits Quotation Header...");
    await invitation.update({ status: "quoted" });
    const quotation = await Quotation.create({
      purchaseRequestId: rfq.id,
      sellerOrganizationId: sellerOrg.id,
      invitationId: invitation.id,
      status: "submitted",
      totalAmount: 150000.00,
      paymentTerms: "Net 30",
    });
    console.log(" - Quotation Created:", quotation.id);

    // 6. Create Quotation Items
    console.log("[5] Seller submits Quotation Items...");
    const qItem1 = await QuotationItem.create({
      quotationId: quotation.id,
      purchaseRequestItemId: item1.id,
      productDNAId: productDNA.id,
      unitPrice: 1000.00,
      quantityOffered: 100,
      leadTime: 5, // 5 days
    });
    const qItem2 = await QuotationItem.create({
      quotationId: quotation.id,
      purchaseRequestItemId: item2.id,
      unitPrice: 15.00,
      quantityOffered: 500,
      leadTime: 2,
    });
    const qItem3 = await QuotationItem.create({
      quotationId: quotation.id,
      purchaseRequestItemId: item3.id,
      unitPrice: 5000.00,
      quantityOffered: 2,
      leadTime: 14,
    });
    console.log(" - Quotation Items Created:", [qItem1.id, qItem2.id, qItem3.id]);

    // 7. Test Partial Award
    console.log("[6] Testing Partial Award...");
    await item1.update({ status: "awarded" });
    console.log(` - Item 1 status changed to: ${item1.status}`);

    // Verify Associations
    const fetchedRfq = await PurchaseRequest.findByPk(rfq.id, {
      include: [
        { model: PurchaseRequestItem, as: "items" },
        { model: PurchaseRequestInvitation, as: "invitations" },
        { 
          model: Quotation, as: "quotations", 
          include: [{ model: QuotationItem, as: "items" }] 
        }
      ]
    });
    
    console.log("\n✅ VERIFICATION SUCCESSFUL");
    console.log(`- Fetched RFQ with ${fetchedRfq.items.length} items`);
    console.log(`- Fetched RFQ with ${fetchedRfq.invitations.length} invitations`);
    console.log(`- Fetched RFQ with ${fetchedRfq.quotations.length} quotations`);
    console.log(`- Fetched Quotation has ${fetchedRfq.quotations[0].items.length} items`);

  } catch (error) {
    console.error("❌ VERIFICATION FAILED:", error);
  } finally {
    process.exit(0);
  }
}

async function setupDb() {
  await PurchaseRequest.sync({ alter: true });
  await PurchaseRequestItem.sync({ alter: true });
  await PurchaseRequestInvitation.sync({ alter: true });
  await Quotation.sync({ alter: true });
  await QuotationItem.sync({ alter: true });
}

setupDb()
  .then(() => runVerification())
  .catch(err => {
    console.error("Sync failed:", err);
    process.exit(1);
  });
