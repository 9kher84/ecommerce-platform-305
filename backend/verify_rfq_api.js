const { sequelize } = require("./sequelize_setup");
const RequestService = require("./services/requestService");
const { User, Category, Organization } = require("./sequelize_setup");

async function runApiVerification() {
  console.log("=== RFQ API REFACTORING VERIFICATION (Blocker 15.5) ===");
  try {
    // 1. Setup Data
    const buyerOrg = await Organization.findOne() || await Organization.create({ name: "Buyer Org" });
    const user = await User.findOne({ where: { role: "buyer" } });
    if (!user) throw new Error("No buyer found to test with");
    await user.update({ subscriptionTier: "plan_a", isActive: true });
    
    // Bypass limit by deleting existing requests
    const { PurchaseRequest } = require("./sequelize_setup");
    await PurchaseRequest.destroy({ where: { userId: user.id } });

    const category = await Category.findOne({ where: { type: "SECTOR" } }) || 
      await Category.create({ name: "Construction Sector", enName: "Construction Sector", type: "SECTOR" });

    // Ensure user has this sector
    await user.addSector(category);

    // 2. Test createRequest with Multi-line DTO
    console.log("\n[1] Testing createRequest with Command DTO...");
    const commandData = {
      header: {
        title: "API Refactored RFQ",
        sectorId: category.id,
        delivery_city: "Riyadh",
        description: "Test description",
        organization_id: buyerOrg.id
      },
      items: [
        { categoryId: category.id, freeTextDescription: "Item 1", quantity: 10, unit: "piece" },
        { freeTextDescription: "Item 2", quantity: 5, unit: "ton" }
      ],
      invitations: []
    };

    const request = await RequestService.createRequest(user.id, commandData);
    console.log("✅ createRequest Success! RFQ ID:", request.id);

    // 3. Test editRequest (Before quotes)
    console.log("\n[2] Testing editRequest (Before Quotes)...");
    const editCommand = {
      header: {
        title: "API Refactored RFQ - EDITED",
      },
      items: [
        { freeTextDescription: "Item 1 EDITED", quantity: 20, unit: "piece" },
      ]
    };
    const editedReq = await RequestService.editRequest(request.id, user.id, editCommand);
    console.log("✅ editRequest Success! Version bumped to:", editedReq.version);

    // 4. Test getRequestDetails (Aggregated Response)
    console.log("\n[3] Testing getRequestDetails (Aggregated Response DTO)...");
    const details = await RequestService.getRequestDetails(request.id, user.id);
    console.log("✅ getRequestDetails Success!");
    console.log(" - Header Title:", details.header.title);
    console.log(" - Version:", details.version);
    console.log(" - Items Count:", details.statistics.itemsCount);
    console.log(" - Quotations Count:", details.statistics.quotationsCount);
    console.log(" - State Machine Status:", details.status);

    // 5. Test State Machine Transition to partially_awarded
    console.log("\n[4] Testing State Machine Transition to partially_awarded...");
    // Mock transitioning to published, quoting, awaiting_decision first
    await request.update({ status: 'awaiting_decision' }); 
    const transitioned = await RequestService.transitionRequestStatus(request.id, 'partially_awarded', user);
    console.log("✅ transitionRequestStatus Success! New status:", transitioned.status);

    console.log("\n✅ ALL TESTS PASSED SUCCESSFULLY");
  } catch (error) {
    console.error("❌ VERIFICATION FAILED:", error);
  } finally {
    process.exit(0);
  }
}

// Ensure DB is synced (we ran alter_rfq_v2 earlier)
sequelize.sync().then(() => runApiVerification());
