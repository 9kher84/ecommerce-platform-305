const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function setup() {
    const client = new Client({ connectionString: 'postgres://postgres:sghl%40hkh%26fihk%24@localhost:5432/ecommerce_db' });
    await client.connect();
    try {
        const hash = await bcrypt.hash('password123', 10);
        const { rows } = await client.query(`SELECT email FROM users WHERE role = 'buyer' LIMIT 1`);
        if (rows.length > 0) {
            const email = rows[0].email;
            await client.query(`UPDATE users SET password = $1, "isActive" = true WHERE email = $2`, [hash, email]);
            console.log(`Password reset successfully and account activated for existing user: ${email}`);
        } else {
            console.log("No buyer found in local database.");
        }
    } catch (e) {
        console.log("Error:", e.message);
    }
    await client.end();
}
setup();
