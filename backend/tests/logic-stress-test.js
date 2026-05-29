const { QuoteService } = require("../services/quoteService");
const RequestService = require("../services/requestService");
const { PriceQuote, PurchaseRequest, User } = require("../sequelize_setup");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

/**
 * 🧪 SOVEREIGN LOGIC STRESS TEST (Red-Team Simulation)
 * Validates that all logic resiliency locks are active and effective.
 */
const runTests = async () => {
  console.log("🛡️ Starting Sovereign Logic Stress Test...");
  let totalTests = 0;
  let successfulBlocks = 0;

  const testSellerId = uuidv4();
  const testBuyerId = uuidv4();
  const testRequestId = uuidv4();

  // 1. Setup Mock User (Seller)
  const { sequelize } = require("../sequelize_setup");
  try {
    await User.create({
      id: testBuyerId,
      name: "Test Buyer",
      email: `buyer-${Date.now()}@test.com`,
      password: "secure-pass-123",
      role: "buyer",
      isActive: true,
    });

    await User.create({
      id: testSellerId,
      name: "Malicious Seller",
      email: `malice-${Date.now()}@test.com`,
      password: "secure-pass-123",
      role: "seller",
      isActive: true,
    });

    await PurchaseRequest.create({
      id: testRequestId,
      userId: testBuyerId,
      title: "Test Request",
      status: "published",
      sectorId: 1,
    });

    console.log("✅ Mock data initialized.");
  } catch (e) {
    console.error("❌ Failed to setup test data:", e.message);
    return;
  }

  // --- TEST 1: PRICE INTEGRITY (0 Amount) ---
  totalTests++;
  console.log(
    `\n🔍 [${totalTests}/4] Simulation: Submitting Quote with 0 amount...`,
  );
  try {
    await QuoteService.submitQuote(testSellerId, {
      purchaseRequestId: testRequestId,
      amount: 0,
    });
    console.error("❌ FAIL: System allowed 0 amount quote.");
  } catch (e) {
    console.log("✅ SUCCESS: System BLOCKED invalid price (0).");
    successfulBlocks++;
  }

  // --- TEST 2: PRICE INTEGRITY (2M Amount) ---
  totalTests++;
  console.log(
    `\n🔍 [${totalTests}/4] Simulation: Submitting Quote with 2,000,000 amount...`,
  );
  try {
    await QuoteService.submitQuote(testSellerId, {
      purchaseRequestId: testRequestId,
      amount: 2000000,
    });
    console.error("❌ FAIL: System allowed 2,000,000 amount quote.");
  } catch (e) {
    console.log("✅ SUCCESS: System BLOCKED invalid price (2M).");
    successfulBlocks++;
  }

  // --- TEST 3: STATUS INTEGRITY (ILLegal Jump) ---
  totalTests++;
  console.log(
    `\n🔍 [${totalTests}/4] Simulation: Attempting jump from Quoting to Completed...`,
  );
  try {
    const auth = { actor: { id: testSellerId, role: "seller" }, ip: "1.2.3.4" };
    await RequestService.transitionRequestStatus(
      testRequestId,
      "completed",
      auth,
    );
    console.error("❌ FAIL: System allowed illegal status transition.");
  } catch (e) {
    console.log("✅ SUCCESS: System BLOCKED illegal transition.");

    // Final check: Is the account suspended?
    const seller = await User.findByPk(testSellerId);
    if (seller && !seller.isActive && seller.is_restricted) {
      console.log(
        "🔥 AUTO-SUSPENSION VERIFIED: Actor account has been suspended.",
      );
      successfulBlocks++;
    } else {
      console.error("❌ FAIL: Actor was NOT suspended after logic violation.");
    }
  }

  // --- TEST 4: FROZEN STATE (Modify Accepted Quote) ---
  totalTests++;
  console.log(
    `\n🔍 [${totalTests}/4] Simulation: Attempting withdrawal of Accepted quote...`,
  );
  try {
    const quoteId = uuidv4();
    await PriceQuote.create({
      id: quoteId,
      purchaseRequestId: testRequestId,
      sellerId: testSellerId,
      amount: 100,
      status: "accepted",
    });

    await QuoteService.withdrawQuote(quoteId, testSellerId, "Malicious Reason");
    console.error("❌ FAIL: System allowed modification of Accepted quote.");
  } catch (e) {
    console.log("✅ SUCCESS: System BLOCKED modification of Frozen quote.");
    successfulBlocks++;
  }

  // 🏁 FINAL WRAP-UP
  console.log("\n--- 🏁 FINAL RESULTS ---");
  const score = (successfulBlocks / totalTests) * 100;
  console.log(`Sovereign Defense Rate: ${score}%`);
  if (score === 100) {
    console.log("🌟 SYSTEM HARDENED: All logic stress tests PASSED.");
  } else {
    console.error(
      "🚨 SECURITY GAPS DETECTED: Review logic resiliency modules.",
    );
  }

  // Cleanup
  await User.destroy({ where: { id: testSellerId }, force: true });
  await PurchaseRequest.destroy({ where: { id: testRequestId }, force: true });
};

// Simplified main entry for script usage
if (require.main === module) {
  runTests().catch((err) => console.error("FATAL TEST ERROR:", err));
}
