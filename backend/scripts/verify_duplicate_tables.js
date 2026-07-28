const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_hudwpP4y8bvU@ep-rapid-river-ap7l6xha-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require'
});

async function verifyDuplicates() {
  await client.connect();
  
  console.log('=== VERIFYING DUPLICATE TABLES ===\n');
  
  const tablePairs = [
    ['Users', 'users'],
    ['Deals', 'deals'],
    ['PriceQuotes', 'price_quotes'],
    ['PurchaseRequests', 'purchase_requests'],
    ['UserCategories', 'user_categories']
  ];
  
  for (const [pascal, snake] of tablePairs) {
    console.log(`--- ${pascal} vs ${snake} ---`);
    
    try {
      const res1 = await client.query(`SELECT COUNT(*) as count FROM "${pascal}"`);
      console.log(`${pascal}: ${res1.rows[0].count} rows`);
    } catch (e) {
      console.log(`${pascal}: ERROR - ${e.message}`);
    }
    
    try {
      const res2 = await client.query(`SELECT COUNT(*) as count FROM ${snake}`);
      console.log(`${snake}: ${res2.rows[0].count} rows`);
    } catch (e) {
      console.log(`${snake}: ERROR - ${e.message}`);
    }
    
    console.log('');
  }
  
  await client.end();
}

verifyDuplicates().catch(console.error);
