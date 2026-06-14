const bcrypt = require('bcrypt');

async function run() {
  try {
    const plainTextPassword = '123456';
    
    // 1. Generate new hash
    const newHash = await bcrypt.hash(plainTextPassword, 10);
    console.log('--- NEW HASH GENERATED ---');
    console.log(newHash);

    // 2. Local bcrypt.compare Test
    const isMatch = await bcrypt.compare(plainTextPassword, newHash);
    console.log('\n--- BCRYPT VERIFICATION ---');
    console.log(`bcrypt.compare('123456', storedHash) = ${isMatch}`);

    // 3. SQL Query for Neon
    console.log('\n--- SQL QUERY TO EXECUTE ON NEON/PRODUCTION ---');
    console.log(`UPDATE "Users"`);
    console.log(`SET password = '${newHash}'`);
    console.log(`WHERE email = 'seller1@test.com';`);
    
    console.log('\n--- SELECT QUERY TO VERIFY ---');
    console.log(`SELECT id, email, password FROM "Users" WHERE email = 'seller1@test.com';`);
    
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
}

run();
