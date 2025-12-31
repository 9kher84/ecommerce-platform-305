const { encrypt, decrypt } = require('./backend/utils/securityUtils');
require('dotenv').config({ path: './.env' }); // Load env for ENCRYPTION_KEY

// Mock ENV if missing for test
if (!process.env.ENCRYPTION_KEY) {
    process.env.ENCRYPTION_KEY = 'a'.repeat(64); // 32 bytes hex
}

const testPrice = 1500.75;
console.log('Original:', testPrice);

try {
    const encrypted = encrypt(testPrice.toString());
    console.log('Encrypted String:', encrypted);

    const decrypted = decrypt(encrypted);
    console.log('Decrypted String:', decrypted);

    const isMatch = parseFloat(decrypted) === testPrice;
    console.log('Match Success:', isMatch);
} catch (e) {
    console.error('Test Failed:', e);
}
