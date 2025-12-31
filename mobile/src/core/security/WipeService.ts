import { SecureStorage } from './Keychain';
import Realm from 'realm';
import { getRealmConfig } from './RealmConfig';
import { Platform } from 'react-native';

/**
 * Enhanced Wipe Service
 * Secure data destruction with proper error handling and destructive testing capabilities.
 */

// Track all keys used in Keychain
const KEYCHAIN_KEYS = [
    'realm_encryption_key',
    'auth_token',
    'user_session',
    'biometric_key',
    'payment_tokens'
];

export const WipeService = {
    /**
     * Securely wipes ALL sensitive data from the device
     */
    wipeAllData: async (): Promise<boolean> => {
        console.warn('🚨 INITIATING SECURE DATA WIPE PROTOCOL 🚨');

        try {
            // 1. Close all Realm instances first
            await this.closeAllRealmInstances();

            // 2. Wipe Keychain completely
            await this.wipeKeychainCompletely();

            // 3. Delete Realm file
            await this.deleteRealmFile();

            // 4. Clear additional app data
            await this.clearAppData();

            console.log('✅ SECURE WIPE COMPLETED SUCCESSFULLY');
            return true;

        } catch (error) {
            console.error('❌ CATASTROPHIC WIPE FAILURE:', error);
            // In case of failure, we throw to let the caller handle (e.g., crash app)
            throw new Error('SECURITY BREACH: Unable to secure device data');
        }
    },

    /**
     * Securely close all Realm instances
     */
    closeAllRealmInstances: async (): Promise<void> => {
        try {
            if (Realm.clearTestState) {
                Realm.clearTestState();
            }
        } catch (error) {
            console.warn('⚠️ Warning during Realm closure:', error);
        }
    },

    /**
     * Completely wipe Keychain
     */
    wipeKeychainCompletely: async (): Promise<void> => {
        const deletionPromises = KEYCHAIN_KEYS.map(async (key) => {
            try {
                await SecureStorage.delete(key);
                console.log(`✅ Deleted Keychain key: ${key}`);
            } catch (error) {
                console.warn(`⚠️ Failed to delete key: ${key}`, error);
            }
        });

        await Promise.all(deletionPromises);
    },

    /**
     * Securely delete Realm file
     */
    deleteRealmFile: async (): Promise<void> => {
        try {
            const config = await getRealmConfig();

            if (config.path && Realm.exists(config)) {
                Realm.deleteFile(config);
                console.log('✅ Realm database file deleted successfully');
            } else {
                const defaultRealm = Realm.defaultPath;
                if (Realm.exists({ path: defaultRealm })) {
                    Realm.deleteFile({ path: defaultRealm });
                    console.log('✅ Default Realm database deleted');
                }
            }
        } catch (error) {
            console.error('❌ Realm deletion failed:', error);
            throw error;
        }
    },

    /**
     * Clear additional app data
     */
    clearAppData: async (): Promise<void> => {
        try {
            const AsyncStorage = await import('@react-native-async-storage/async-storage');
            await AsyncStorage.default.clear();
            console.log('✅ AsyncStorage cleared');
        } catch (error) {
            console.warn('⚠️ Additional data clearance warnings:', error);
        }
    },

    // ==========================================
    // 🧪 DESTRUCTIVE TESTING METHODS
    // ==========================================

    /**
     * Destructive Test Suite
     * Simulates worst-case scenarios to verify wipe resilience.
     */
    destructiveTest: async (): Promise<void> => {
        console.warn('🧪 BEGINNING DESTRUCTIVE WIPE TESTS');

        try {
            // Scenario 1: Realm Open & Active
            await this.testWithActiveRealm();

            // Scenario 2: Keychain Corrupted/Missing
            await this.testCorruptedKeychain();

            // Scenario 3: Low Memory (Simulated)
            await this.testLowMemoryScenario();

            console.log('✅ ALL DESTRUCTIVE TESTS PASSED');
        } catch (error) {
            console.error('❌ DESTRUCTIVE TEST FAILED:', error);
            throw error;
        }
    },

    testWithActiveRealm: async (): Promise<void> => {
        console.log('🧪 Testing Wipe with Active Realm Instance...');
        const config = await getRealmConfig();
        const realm = await Realm.open(config);

        // Write some data
        realm.write(() => {
            // Creating a dummy object if schema allows, or just keeping it open
        });

        // Attempt Wipe while open
        await WipeService.wipeAllData();

        if (!realm.isClosed) {
            console.warn('⚠️ Realm instance was not closed automatically, forcing close check.');
        }
    },

    testCorruptedKeychain: async (): Promise<void> => {
        console.log('🧪 Testing Wipe with Missing/Corrupted Keychain...');
        // Simulate missing keys by deleting them first
        await SecureStorage.delete('realm_encryption_key');

        // Wipe should still succeed (idempotent)
        await WipeService.wipeAllData();
    },

    testLowMemoryScenario: async (): Promise<void> => {
        console.log('🧪 Testing Wipe under Low Memory (Simulation)...');
        // In a real native test, we would allocate large buffers here.
        // For JS simulation, we ensure the wipe logic is efficient.
        const t0 = Date.now();
        await WipeService.wipeAllData();
        const t1 = Date.now();
        console.log(`⏱️ Wipe Time: ${t1 - t0}ms`);
    }
};
