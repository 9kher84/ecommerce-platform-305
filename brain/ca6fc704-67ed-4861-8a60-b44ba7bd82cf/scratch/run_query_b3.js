module.paths.push('c:\\Users\\s9khr\\sasasa\\ecommerce-platform\\backend\\node_modules');
const { Client } = require('pg');

const NEON_URL = 'postgresql://neondb_owner:npg_hudwpP4y8bvU@ep-rapid-river-ap7l6xha-pooler.c-7.us-east-1.aws.neon.tech/neondb?sslmode=require';

async function run() {
  const client = new Client({ connectionString: NEON_URL });
  try {
    await client.connect();
    
    console.log("--- QUERY 1 ---");
    const q1 = `
      SELECT id, title, status, "categoryId", "sectorId", "userId", "is_active", "expiresAt", "createdAt"
      FROM "PurchaseRequests"
      ORDER BY "createdAt" DESC
      LIMIT 20;
    `;
    const res1 = await client.query(q1);
    console.log(JSON.stringify(res1.rows, null, 2));

    console.log("--- QUERY 2 ---");
    const q2 = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'PurchaseRequests'
      ORDER BY ordinal_position;
    `;
    const res2 = await client.query(q2);
    console.log(JSON.stringify(res2.rows, null, 2));

    console.log("--- QUERY 3 ---");
    const q3 = `
      SELECT id, email, role FROM "Users" WHERE role = 'buyer';
    `;
    const res3 = await client.query(q3);
    console.log(JSON.stringify(res3.rows, null, 2));

    console.log("--- QUERY 4 ---");
    const q4 = `
      SELECT uc."userId", u.email, uc."categoryId", c.name_en
      FROM "UserCategories" uc
      JOIN "Users" u ON u.id = uc."userId"
      JOIN "Categories" c ON c.id = uc."categoryId"
      ORDER BY u.email;
    `;
    const res4 = await client.query(q4);
    console.log(JSON.stringify(res4.rows, null, 2));

  } catch (err) {
    console.error("SQL Error:", err.message);
  } finally {
    await client.end();
  }
}

run();
