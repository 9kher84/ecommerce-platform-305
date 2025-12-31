const crypto = require('crypto');

// Configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_ENV_VAR = 'ENCRYPTION_KEY'; // Master Key in ENV

/**
 * Sovereign Key Manager
 * Ensures valid 32-byte master key exists.
 */
function getMasterKey() {
    const keyHex = process.env[KEY_ENV_VAR];
    if (!keyHex) {
        // Fallback for dev ONLY or Error in Prod
        if (process.env.NODE_ENV === 'production') {
            throw new Error('FATAL: ENCRYPTION_KEY not set in production.');
        }
        return Buffer.from('0000000000000000000000000000000000000000000000000000000000000000', 'hex'); // 32 bytes mock
    }
    // Handle both Hex string and raw string if length matches
    if (keyHex.length === 64) {
        return Buffer.from(keyHex, 'hex');
    }
    // If raw 32 char string
    if (keyHex.length === 32) {
        return Buffer.from(keyHex);
    }
    throw new Error('Invalid ENCRYPTION_KEY length. Must be 32 bytes (64 hex chars).');
}

exports.encrypt = (text) => {
    if (!text) return null;
    try {
        const masterKey = getMasterKey();
        const iv = crypto.randomBytes(12); // 96-bit IV for GCM is standard recommended
        const cipher = crypto.createCipheriv(ALGORITHM, masterKey, iv);

        // GCM requires no padding usually, handled by node
        let encrypted = cipher.update(String(text), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');

        // Format: iv:authTag:encryptedContent
        return `${iv.toString('hex')}:${authTag}:${encrypted}`;
    } catch (error) {
        console.error('Encryption failed', error.message);
        throw new Error('Encryption Service Error');
    }
};

exports.decrypt = (encryptedText) => {
    if (!encryptedText) return null;
    try {
        const parts = encryptedText.split(':');
        if (parts.length !== 3) throw new Error('Invalid format');

        const [ivHex, authTagHex, contentHex] = parts;
        const masterKey = getMasterKey();
        const decipher = crypto.createDecipheriv(ALGORITHM, masterKey, Buffer.from(ivHex, 'hex'));

        decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

        let decrypted = decipher.update(contentHex, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (error) {
        console.error('Decryption failed', error.message);
        return null; // Fail safe
    }
};
