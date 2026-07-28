const { sequelize, User, PurchaseRequest, WorkPackage, CommercialProcess, ProcessParty, NegotiationSheet } = require('../sequelize_setup');
const { v4: uuidv4 } = require('uuid');

async function seedQA() {
  console.log("🚀 Starting QA Scenario Seeding...");

  try {
    await sequelize.authenticate();
    
    // Fix Postgres Enums
    await sequelize.query("ALTER TYPE \"enum_CommercialProcesses_status\" ADD VALUE IF NOT EXISTS 'pending_award';").catch(() => {});
    await sequelize.query("ALTER TYPE \"enum_CommercialProcesses_status\" ADD VALUE IF NOT EXISTS 'awarded';").catch(() => {});
    await sequelize.query("ALTER TYPE \"enum_NegotiationSheets_decision\" ADD VALUE IF NOT EXISTS 'WITHDRAW';").catch(() => {});
    await sequelize.query("ALTER TYPE \"enum_NegotiationSheets_status\" ADD VALUE IF NOT EXISTS 'WITHDRAWN';").catch(() => {});
    await sequelize.query("ALTER TYPE \"enum_PurchaseRequests_status\" ADD VALUE IF NOT EXISTS 'published';").catch(() => {});
    
    // Clear existing QA data
    await NegotiationSheet.destroy({ where: {} });
    await ProcessParty.destroy({ where: {} });
    await CommercialProcess.destroy({ where: {} });
    await WorkPackage.destroy({ where: {} });
    await PurchaseRequest.destroy({ where: {} });
    console.log("🧹 Cleared old transactions.");

    // Load Users
    const buyerConst = await User.findOne({ where: { email: 'buyer.construction@test.com' } });
    const buyerHosp = await User.findOne({ where: { email: 'buyer.hospital@test.com' } });
    
    const sellerCement = await User.findOne({ where: { email: 'seller.cement@test.com' } });
    const sellerSteel = await User.findOne({ where: { email: 'seller.steel@test.com' } });
    const sellerElectric = await User.findOne({ where: { email: 'seller.electric@test.com' } });
    const sellerMulti = await User.findOne({ where: { email: 'seller.multi@test.com' } });

    if (!buyerConst || !sellerCement) {
      console.error("❌ Users not found. Please run `node bootstrap_wave2_env.js` first.");
      process.exit(1);
    }

    /* -------------------------------------------------------------------------- */
    /* Scenario 1: School Project (Standard multi-package)                        */
    /* -------------------------------------------------------------------------- */
    const prSchool = await PurchaseRequest.create({
      id: uuidv4(),
      userId: buyerConst.id,
      title: 'School Project - Phase 1',
      status: 'published',
      description: 'Standard construction for new high school.'
    });

    await WorkPackage.bulkCreate([
      { id: uuidv4(), purchaseRequestId: prSchool.id, name: 'Concrete Works', status: 'open' },
      { id: uuidv4(), purchaseRequestId: prSchool.id, name: 'Steel Works', status: 'open' },
      { id: uuidv4(), purchaseRequestId: prSchool.id, name: 'Electrical', status: 'open' }
    ]);
    console.log("✅ Scenario 1: School Project Created");

    /* -------------------------------------------------------------------------- */
    /* Scenario 2: Hospital Project (Complex Negotiations)                        */
    /* -------------------------------------------------------------------------- */
    const prHosp = await PurchaseRequest.create({
      id: uuidv4(),
      userId: buyerHosp.id,
      title: 'City General Hospital',
      status: 'published',
      description: 'Major medical facility.'
    });

    const wpSteel = await WorkPackage.create({ id: uuidv4(), purchaseRequestId: prHosp.id, name: 'Structural Steel', status: 'open' });
    const wpCement = await WorkPackage.create({ id: uuidv4(), purchaseRequestId: prHosp.id, name: 'Foundation Cement', status: 'open' });

    // 3 Steel Sellers bidding
    const sellers = [sellerSteel, sellerMulti, sellerElectric]; // Electric acting as general contractor here
    for (let i = 0; i < 3; i++) {
      const proc = await CommercialProcess.create({
        id: uuidv4(),
        workPackageId: wpSteel.id,
        processType: 'NEGOTIATION',
        status: i === 0 ? 'waiting_buyer' : 'waiting_seller' // First is waiting buyer, others waiting seller
      });

      const parties = await ProcessParty.bulkCreate([
        { id: uuidv4(), commercialProcessId: proc.id, userId: buyerHosp.id, partyRole: 'BUYER' },
        { id: uuidv4(), commercialProcessId: proc.id, userId: sellers[i].id, partyRole: 'SELLER' }
      ]);

      // Add a Negotiation Sheet
      await NegotiationSheet.create({
        id: uuidv4(),
        commercialProcessId: proc.id,
        initiatorPartyId: parties[1].id,
        version: 1,
        authorId: sellers[i].id,
        status: 'PENDING',
        decision: 'PROPOSAL',
        terms: { price: 100000 + (i * 5000), deliveryDays: 30 - (i * 5) }
      });
    }
    console.log("✅ Scenario 2: Hospital Project Complex Negotiations Created");

    /* -------------------------------------------------------------------------- */
    /* Scenario 3 & 4: Liquidation & Withdrawn                                    */
    /* -------------------------------------------------------------------------- */
    const prLiq = await PurchaseRequest.create({
      id: uuidv4(),
      userId: buyerConst.id,
      title: 'Warehouse Clearance',
      status: 'published'
    });
    const wpLiq = await WorkPackage.create({ id: uuidv4(), purchaseRequestId: prLiq.id, name: 'Clearance Package', status: 'open' });
    
    // Withdrawn Process
    const procWithdrawn = await CommercialProcess.create({ id: uuidv4(), workPackageId: wpLiq.id, processType: 'NEGOTIATION', status: 'closed' });
    const p1 = await ProcessParty.create({ id: uuidv4(), commercialProcessId: procWithdrawn.id, userId: buyerConst.id, partyRole: 'BUYER' });
    const p2 = await ProcessParty.create({ id: uuidv4(), commercialProcessId: procWithdrawn.id, userId: sellerCement.id, partyRole: 'SELLER' });
    await NegotiationSheet.create({
      id: uuidv4(), commercialProcessId: procWithdrawn.id, initiatorPartyId: p2.id, version: 1, authorId: sellerCement.id,
      status: 'WITHDRAWN', decision: 'WITHDRAW', terms: { price: 50000 }
    });

    // Expired Process
    const procExpired = await CommercialProcess.create({ id: uuidv4(), workPackageId: wpLiq.id, processType: 'NEGOTIATION', status: 'expired' });
    const p3 = await ProcessParty.create({ id: uuidv4(), commercialProcessId: procExpired.id, userId: buyerConst.id, partyRole: 'BUYER' });
    const p4 = await ProcessParty.create({ id: uuidv4(), commercialProcessId: procExpired.id, userId: sellerMulti.id, partyRole: 'SELLER' });
    await NegotiationSheet.create({
      id: uuidv4(), commercialProcessId: procExpired.id, initiatorPartyId: p4.id, version: 1, authorId: sellerMulti.id,
      status: 'EXPIRED', decision: 'PROPOSAL', terms: { price: 45000 }
    });
    console.log("✅ Scenario 3 & 4: Expired and Withdrawn scenarios Created");

    /* -------------------------------------------------------------------------- */
    /* Scenario 5 & 6: Shopping Cart checkout (Multi-Award)                       */
    /* -------------------------------------------------------------------------- */
    const prGov = await PurchaseRequest.create({
      id: uuidv4(), userId: buyerConst.id, title: 'Government Housing', status: 'published'
    });
    const wpGov1 = await WorkPackage.create({ id: uuidv4(), purchaseRequestId: prGov.id, name: 'Concrete', status: 'open' });
    const wpGov2 = await WorkPackage.create({ id: uuidv4(), purchaseRequestId: prGov.id, name: 'Steel', status: 'open' });

    // Concrete Pending Award
    const procGov1 = await CommercialProcess.create({ id: uuidv4(), workPackageId: wpGov1.id, processType: 'NEGOTIATION', status: 'pending_award' });
    const govParties1 = await ProcessParty.bulkCreate([
      { id: uuidv4(), commercialProcessId: procGov1.id, userId: buyerConst.id, partyRole: 'BUYER' },
      { id: uuidv4(), commercialProcessId: procGov1.id, userId: sellerCement.id, partyRole: 'SELLER' }
    ]);
    await NegotiationSheet.create({ id: uuidv4(), commercialProcessId: procGov1.id, initiatorPartyId: govParties1[1].id, version: 2, authorId: sellerCement.id, status: 'ACCEPTED', decision: 'FINAL', terms: { price: 200000 } });

    // Steel Pending Award
    const procGov2 = await CommercialProcess.create({ id: uuidv4(), workPackageId: wpGov2.id, processType: 'NEGOTIATION', status: 'pending_award' });
    const govParties2 = await ProcessParty.bulkCreate([
      { id: uuidv4(), commercialProcessId: procGov2.id, userId: buyerConst.id, partyRole: 'BUYER' },
      { id: uuidv4(), commercialProcessId: procGov2.id, userId: sellerSteel.id, partyRole: 'SELLER' }
    ]);
    await NegotiationSheet.create({ id: uuidv4(), commercialProcessId: procGov2.id, initiatorPartyId: govParties2[1].id, version: 3, authorId: sellerSteel.id, status: 'ACCEPTED', decision: 'FINAL', terms: { price: 350000 } });

    console.log("✅ Scenario 5 & 6: Pending Awards Checkout Created");

    console.log("\n🎉 Seeding Complete! QA Data Loaded.");
    console.log("\n--- TEST CREDENTIALS ---");
    console.log("Password for all: password123");
    console.log("Buyer Construction: buyer.construction@test.com");
    console.log("Buyer Hospital: buyer.hospital@test.com");
    console.log("Seller Cement: seller.cement@test.com");
    console.log("Seller Steel: seller.steel@test.com");
    
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding Error:", err);
    process.exit(1);
  }
}

seedQA();
