const { Client } = require('pg');
require('dotenv').config();

async function run() {
  const c = new Client({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'ecommerce_db'
  });
  await c.connect();
  const res = await c.query(`INSERT INTO sectors (name, "createdAt", "updatedAt") VALUES ('{"en":"Test","ar":"Test"}', NOW(), NOW()) RETURNING id`);
  const sectorId = res.rows[0].id;
  await c.query(`INSERT INTO categories (name, "sectorId", "createdAt", "updatedAt") VALUES ('{"en":"Cat","ar":"Cat"}', $1, NOW(), NOW())`, [sectorId]);
  console.log('Seeded!');
  await c.end();
}
run().catch(console.error);
