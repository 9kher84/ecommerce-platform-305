const { sequelize } = require('../sequelize_setup');
const { v4: uuidv4 } = require('uuid');

async function go() {
  await sequelize.authenticate();

  // Get first PR
  const [[pr]] = await sequelize.query(`SELECT id, price_range_min FROM "PurchaseRequests" LIMIT 1;`);
  console.log('PR:', pr);

  // Get first seller from "Users"
  const [[seller]] = await sequelize.query(`SELECT id FROM "Users" WHERE email LIKE 'seller%@testdata.com' LIMIT 1;`);
  console.log('Seller:', seller);

  // Try inserting a quote
  try {
    await sequelize.query(
      `INSERT INTO "PriceQuotes" (id, "purchaseRequestId", "sellerId", price, message, status, "createdAt", "updatedAt")
       VALUES (:id, :prId, :sId, :price, 'test', 'pending', NOW(), NOW())`,
      { replacements: { id: uuidv4(), prId: pr.id, sId: seller.id, price: 500 } }
    );
    console.log('✅ Quote inserted successfully!');
  } catch(e) {
    console.error('❌ Quote insert error:', e.message);
  }

  process.exit(0);
}
go();
