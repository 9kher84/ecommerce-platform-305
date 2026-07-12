// test_neon.js – query Neon DB version
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { Client } = require('pg');
const connStr = process.env.NEON_DATABASE_URL;
if (!connStr) {
  console.error('NEON_DATABASE_URL not set');
  process.exit(1);
}
const client = new Client({ connectionString: connStr });
client.connect()
  .then(async () => {
    try {
        const bcrypt = require('bcrypt');
        const hash = await bcrypt.hash('password123', 10);
        const { rows } = await client.query(`SELECT email FROM users WHERE role = 'buyer' LIMIT 1`);
        if (rows.length > 0) {
            const email = rows[0].email;
            await client.query(`UPDATE users SET password = $1, "isActive" = true WHERE email = $2`, [hash, email]);
            console.log(`Password reset successfully for Neon user: ${email}`);
        } else {
            console.log("No buyer found in Neon database.");
        }
    } catch (e) {
        console.log("ERROR:", e.message);
    }
    return client.end();
  })
  .catch(err => {
    console.error('ERROR:', err.message);
    client.end();
  });
