const { User, PurchaseRequest, PriceQuote, Product, SmartInventory, Category, sequelize } = require('../sequelize_setup');

async function runInventory() {
  try {
    console.log("=== 1. Basic Tables Count ===");
    const usersCount = await User.count();
    const reqsCount = await PurchaseRequest.count();
    const quotesCount = await PriceQuote.count();
    const prodsCount = await Product.count();
    const invsCount = await SmartInventory.count();
    const catsCount = await Category.count();
    
    console.log(`Users: ${usersCount}`);
    console.log(`PurchaseRequests: ${reqsCount}`);
    console.log(`PriceQuotes: ${quotesCount}`);
    console.log(`Products: ${prodsCount}`);
    console.log(`SmartInventories: ${invsCount}`);
    console.log(`Categories: ${catsCount}`);

    console.log("\n=== 2 & 3. Active Users Activity ===");
    const [userStats] = await sequelize.query(`
      SELECT 
        u.id, 
        u.email,
        (SELECT COUNT(*) FROM "PurchaseRequests" WHERE "userId" = u.id) as rfq_count,
        (SELECT COUNT(*) FROM "PriceQuotes" WHERE "sellerId" = u.id) as quote_count,
        (SELECT COUNT(*) FROM "Products" WHERE "sellerId" = u.id) as product_count,
        (SELECT COUNT(*) FROM "SmartInventories" WHERE "sellerId" = u.id) as inventory_count
      FROM "Users" u
      WHERE 
        (SELECT COUNT(*) FROM "PurchaseRequests" WHERE "userId" = u.id) > 0 OR
        (SELECT COUNT(*) FROM "PriceQuotes" WHERE "sellerId" = u.id) > 0 OR
        (SELECT COUNT(*) FROM "Products" WHERE "sellerId" = u.id) > 0
    `);
    
    console.table(userStats);

    console.log("\n=== 5. Check seller1@test.com ===");
    const seller1 = await User.findOne({ where: { email: 'seller1@test.com' }});
    if (seller1) {
      const rfqC = await PurchaseRequest.count({ where: { userId: seller1.id } });
      const qtC = await PriceQuote.count({ where: { sellerId: seller1.id } });
      const prC = await Product.count({ where: { sellerId: seller1.id } });
      const inC = await SmartInventory.count({ where: { sellerId: seller1.id } });
      console.log(`seller1@test.com exists. RFQs: ${rfqC}, Quotes: ${qtC}, Products: ${prC}, Inventories: ${inC}`);
      console.log(`Status: ${rfqC+qtC+prC+inC === 0 ? 'EMPTY ACCOUNT' : 'ACTIVE ACCOUNT'}`);
    } else {
      console.log("seller1@test.com NOT FOUND in this database.");
    }
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

runInventory();
