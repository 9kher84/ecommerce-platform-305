const RequestService = require("../services/requestService");
const { User, sequelize } = require("../sequelize_setup");

// Mock Data
const mockFreeBuyer = {
  id: "buyer-free-uuid",
  role: "buyer",
  subscriptionTier: "free",
};

const mockRequestDataSecret = {
  title: "Test Secret",
  categoryId: 1,
  deliveryDates: [new Date()],
  auction_type: "secret",
};

const mockRequestDataDirect = {
  title: "Test Direct",
  categoryId: 1,
  deliveryDates: [new Date()],
  post_type: "direct",
  directPurchase: true,
  targetSellerId: 1,
};

async function runUnitTest() {
  console.log("🧪 Starting DIRECT Unit Test for RequestService");
  console.log("=============================================");

  try {
    const freeBuyer = await User.findOne({
      where: { email: "buyer_free@test.com" },
    });

    if (!freeBuyer) {
      console.error(
        "❌ Setup Failed: Buyer Free not found in DB. Run seed first.",
      );
      return;
    }

    console.log(
      `🔹 Testing with User: ${freeBuyer.email} (${freeBuyer.subscriptionTier})`,
    );

    // 2. Test Secret Auction
    console.log('\n🔹 Test Case 1: createRequest with auction_type="secret"');
    try {
      await RequestService.createRequest(freeBuyer.id, mockRequestDataSecret);
      console.error("❌ FAILED: Method executed but should have thrown Error!");
    } catch (error) {
      if (error.message.includes("المناقصات السرية تتطلب خطة أ أو خطة ب")) {
        console.log("✅ PASSED: Caught expected error.");
        console.log(`   Error: ${error.message}`);
      } else {
        console.error("❌ FAILED: Caught unexpected error.");
        console.error(error);
      }
    }

    // 3. Test Direct Purchase
    console.log('\n🔹 Test Case 2: createRequest with post_type="direct"');
    try {
      await RequestService.createRequest(freeBuyer.id, mockRequestDataDirect);
      console.error("❌ FAILED: Method executed but should have thrown Error!");
    } catch (error) {
      if (error.message.includes("الشراء المباشر يتطلب خطة أ أو خطة ب")) {
        console.log("✅ PASSED: Caught expected error.");
        console.log(`   Error: ${error.message}`);
      } else {
        console.error("❌ FAILED: Caught unexpected error.");
        console.error(error);
      }
    }
  } catch (error) {
    console.error("❌ Test Runner Error:", error);
  } finally {
    // Close DB connection
    // await sequelize.close(); // Keep open if needed, or close to exit cleanly
    process.exit(0);
  }
}

runUnitTest();
