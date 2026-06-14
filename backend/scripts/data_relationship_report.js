const { User, PurchaseRequest, PriceQuote, Product, SmartInventory, sequelize } = require('../sequelize_setup');

async function generateReport() {
  try {
    console.log("--- DATA RELATIONSHIP REPORT ---\n");

    // 1. Check seller1@test.com
    const seller = await User.findOne({ 
      where: { email: 'seller1@test.com' },
      attributes: ['id', 'role', 'isActive'] // companyId, sellerProfileId, accountType don't exist directly on User
    });

    if (seller) {
      console.log(`[USER FOUND]: seller1@test.com`);
      console.log(`- ID: ${seller.id}`);
      console.log(`- Role: ${seller.role}`);
      console.log(`- isActive: ${seller.isActive}`);
      
      // Check quotes by this seller
      const sellerQuotes = await PriceQuote.count({ where: { sellerId: seller.id } });
      console.log(`- Quotes Owned: ${sellerQuotes}`);
      
      // Check products by this seller
      const sellerProducts = await Product.count({ where: { sellerId: seller.id } });
      console.log(`- Products Owned: ${sellerProducts}`);
      
      // Check inventories by this seller
      const sellerInventories = await SmartInventory.count({ where: { sellerId: seller.id } });
      console.log(`- SmartInventories Owned: ${sellerInventories}`);
    } else {
      console.log(`[USER NOT FOUND]: seller1@test.com does not exist in this database.\n`);
    }

    console.log("\n--- SYSTEM WIDE DATA OVERVIEW ---");

    // RFQs
    const rfqCounts = await PurchaseRequest.findAll({
      attributes: ['userId', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['userId'],
      raw: true
    });
    
    console.log("\n[PurchaseRequests (RFQs) Distribution]:");
    for (const rfq of rfqCounts) {
      const u = await User.findByPk(rfq.userId, { attributes: ['email'] });
      console.log(`- User: ${u ? u.email : 'Unknown'} (ID: ${rfq.userId}) -> ${rfq.count} RFQs`);
    }

    // Quotes
    const quoteCounts = await PriceQuote.findAll({
      attributes: ['sellerId', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['sellerId'],
      raw: true
    });

    console.log("\n[PriceQuotes Distribution]:");
    for (const quote of quoteCounts) {
      const u = await User.findByPk(quote.sellerId, { attributes: ['email'] });
      console.log(`- Seller: ${u ? u.email : 'Unknown'} (ID: ${quote.sellerId}) -> ${quote.count} Quotes`);
    }

    // Products
    const productCounts = await Product.findAll({
      attributes: ['sellerId', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['sellerId'],
      raw: true
    });

    console.log("\n[Products Distribution]:");
    for (const p of productCounts) {
      const u = await User.findByPk(p.sellerId, { attributes: ['email'] });
      console.log(`- Seller: ${u ? u.email : 'Unknown'} (ID: ${p.sellerId}) -> ${p.count} Products`);
    }

  } catch (error) {
    console.error("Error generating report:", error);
  } finally {
    process.exit(0);
  }
}

generateReport();
