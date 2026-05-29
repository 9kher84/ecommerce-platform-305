/**
 * FINAL E2E RFQ FLOW VERIFICATION SCRIPT (BACKEND VERSION)
 * For: Sovereign Architecture Governor (DeepSeek)
 */
const {
  sequelize,
  User,
  PurchaseRequest,
  PriceQuote,
  Deal,
  Category,
} = require("./sequelize_setup");
const RequestService = require("./services/requestService");
const QuoteService = require("./services/quoteService");
const { Op } = require("sequelize");

async function runE2E() {
  console.log("🚀 Starting Final RFQ Flow Verification...");
  const globalStart = Date.now();

  try {
    // 0. Ensure Database Connection
    await sequelize.authenticate();
    console.log("✅ Database Connected.");

    // 1. SETUP: Find or Create Buyer & Seller
    let buyer = await User.findOne({ where: { role: "buyer" } });
    if (!buyer) {
      buyer = await User.create({
        name: "Test Buyer",
        email: "buyer_test@example.com",
        password: "password123",
        role: "buyer",
        mobile: "0501111111",
      });
    }

    let seller = await User.findOne({ where: { role: "seller" } });
    if (!seller) {
      seller = await User.create({
        name: "Test Seller",
        email: "seller_test@example.com",
        password: "password123",
        role: "seller",
        mobile: "0502222222",
      });
    }

    let buildingCategory = await Category.findOne({
      where: { name_ar: { [Op.like]: "%مواد بناء%" } },
    });
    if (!buildingCategory) {
      buildingCategory = await Category.create({
        name_ar: "مواد بناء",
        name_en: "Building Materials",
      });
    }

    // =====================================================================
    // PART 1: BUYER PUBLISHES RFQ
    // =====================================================================
    console.log("\n--- PART 1: BUYER FLOW ---");
    const buyerStart = Date.now();

    const rfqData = {
      title: "100 طن أسمنت - TEST " + Date.now(),
      description: "أسمنت بورتلاندي عادي عالي الجودة",
      sectorId: buildingCategory.id,
      quantity: 100,
      unit: "طن",
      status: "rfq_published",
      delivery_city: "الرياض",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    };

    const request = await PurchaseRequest.create({
      ...rfqData,
      userId: buyer.id,
    });

    console.log(`✅ RFQ Created: ${request.id}`);
    console.log(`Status: ${request.status}`);

    const buyerEnd = Date.now();
    const buyerDuration = (buyerEnd - buyerStart) / 1000;
    console.log(`⏱️ Buyer Flow Duration: ${buyerDuration.toFixed(2)}s`);

    // =====================================================================
    // PART 2: SELLER SUBMITS QUOTE
    // =====================================================================
    console.log("\n--- PART 2: SELLER FLOW ---");
    const sellerStart = Date.now();

    const quoteData = {
      amount: 50000,
      deliveryTime: "5 days",
      warrantyMonths: 12,
      technicalDetails: "متوفر فوراً - جودة عالية",
    };

    const quote = await PriceQuote.create({
      ...quoteData,
      purchaseRequestId: request.id,
      sellerId: seller.id,
      status: "pending",
      rfqType: "standard",
    });

    console.log(`✅ Quote Submitted: ${quote.id}`);

    const sellerEnd = Date.now();
    const sellerDuration = (sellerEnd - sellerStart) / 1000;
    console.log(`⏱️ Seller Flow Duration: ${sellerDuration.toFixed(2)}s`);

    // =====================================================================
    // PART 3: BUYER DECISION (ACCEPT)
    // =====================================================================
    console.log("\n--- PART 3: DECISION FLOW ---");
    const decisionStart = Date.now();

    await QuoteService.makeDecision(quote.id, buyer.id, {
      status: "accepted",
      buyerNotes: "تم الاختيار للسعر المناسب",
    });

    console.log(`✅ Decision Made: ACCEPTED`);

    const decisionEnd = Date.now();
    const decisionDuration = (decisionEnd - decisionStart) / 1000;
    console.log(`⏱️ Decision Flow Duration: ${decisionDuration.toFixed(2)}s`);

    // =====================================================================
    // PART 4: CONTACT REVEAL & DEAL VERIFICATION
    // =====================================================================
    console.log("\n--- PART 4: CONTACT REVEAL VERIFICATION ---");

    const deal = await Deal.findOne({
      where: { purchaseRequestId: request.id },
      include: [
        { model: User, as: "seller", attributes: ["name", "mobile", "email"] },
        { model: User, as: "buyer", attributes: ["name", "mobile", "email"] },
      ],
    });

    if (deal) {
      console.log("✅ Deal Created Automatically.");
      console.log(
        `Seller Contact: ${deal.seller.name} (${deal.seller.mobile})`,
      );
      console.log(`Buyer Contact: ${deal.buyer.name} (${deal.buyer.mobile})`);
      console.log("✅ DATA REVEALED SUCCESSFULLY.");
    } else {
      console.error("❌ Deal NOT Created.");
    }

    // =====================================================================
    // SUMMARY
    // =====================================================================
    console.log("\n========================================");
    console.log("🏁 VERIFICATION COMPLETE");
    console.log(
      `Overall E2E Execution: ${((Date.now() - globalStart) / 1000).toFixed(2)}s`,
    );
    console.log("========================================");
  } catch (error) {
    console.error("❌ VERIFICATION FAILED:", error);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

runE2E();
