const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_hudwpP4y8bvU@ep-rapid-river-ap7l6xha-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function checkCounts() {
  await client.connect();
  
  const tables = ['Users', 'users', 'Deals', 'deals', 'PriceQuotes', 'price_quotes', 'PurchaseRequests', 'purchase_requests', 'UserCategories', 'user_categories'];
  
  for (const table of tables) {
    try {
      const res = await client.query(`SELECT COUNT(*) as count FROM "${table}"`);
      console.log(`${table}: ${res.rows[0].count}`);
    } catch (e) {
      console.log(`${table}: ERROR - ${e.message}`);
    }
  }
  
  await client.end();
}

checkCounts().catch(console.error);
