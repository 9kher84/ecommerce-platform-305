import Realm from 'realm';
import { SecureStorage } from './Keychain';
import { Buffer } from 'buffer'; // Requires 'buffer' polyfill in RN

/**
 * Realm Database Configuration
 * Enforces AES-256-GCM encryption for the local database.
 */

const ENCRYPTION_KEY_STORAGE_KEY = 'realm_encryption_key';

// Define your schemas here (Example)
const UserSchema = {
    name: 'User',
    properties: {
        _id: 'string',
        name: 'string',
        email: 'string',
        role: 'string',
        isVerified: 'bool',
    },
    primaryKey: '_id',
};

export const getRealmConfig = async (): Promise<Realm.Configuration> => {
    let keyHex = await SecureStorage.get(ENCRYPTION_KEY_STORAGE_KEY);
    let encryptionKey: ArrayBuffer;

    if (!keyHex) {
        console.log('Generating new Realm encryption key...');
        // Generate 64 bytes (512 bits) random key
        // In React Native, use a secure random generator library.
        // For this stub, we simulate generation. In prod, use 'react-native-get-random-values'
        const randomBytes = new Uint8Array(64);
        for (let i = 0; i < 64; i++) {
            randomBytes[i] = Math.floor(Math.random() * 256);
        }

        // Convert to Hex for storage
        keyHex = Buffer.from(randomBytes).toString('hex');

        // Save securely
        const saved = await SecureStorage.save(ENCRYPTION_KEY_STORAGE_KEY, keyHex);
        if (!saved) {
            throw new Error('Failed to save encryption key. Cannot open database securely.');
        }
        encryptionKey = randomBytes.buffer;
    } else {
        // Convert Hex back to ArrayBuffer
        const buffer = Buffer.from(keyHex, 'hex');
        encryptionKey = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    }

    // Validate key length
    if (encryptionKey.byteLength !== 64) {
        throw new Error(`Invalid encryption key length: ${encryptionKey.byteLength}. Must be 64 bytes.`);
    }

    const config: Realm.Configuration = {
        schema: [UserSchema],
        encryptionKey: encryptionKey as any, // Cast to any because Realm types can be strict about ArrayBuffer/Int8Array
        schemaVersion: 1,
        path: 'ecommerce_secure.realm',
    };

    return config;
};

export const getRealm = async (): Promise<Realm> => {
    try {
        const config = await getRealmConfig();
        const realm = await Realm.open(config);
        return realm;
    } catch (error) {
        console.error('Failed to open encrypted Realm:', error);
        // Potential Auto-Wipe logic here if key is invalid/corrupted
        throw error;
    }
};
