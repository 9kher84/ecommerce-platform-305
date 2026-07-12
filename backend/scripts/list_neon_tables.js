// list_neon_tables.js – query active tables in Neon DB
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { Client } = require('pg');
const connStr = process.env.NEON_DATABASE_URL;
if (!connStr) {
  console.error('NEON_DATABASE_URL not set');
  process.exit(1);
}
const client = new Client({ connectionString: connStr });
client.connect()
  .then(() => client.query(`SELECT table_schema, table_name FROM information_schema.tables WHERE table_type='BASE TABLE' AND table_schema NOT IN ('pg_catalog', 'information_schema') ORDER BY table_schema, table_name;`))
  .then(res => {
    console.log('TABLES:', JSON.stringify(res.rows, null, 2));
    return client.end();
  })
  .catch(err => {
    console.error('ERROR:', err.message);
    client.end();
  });
