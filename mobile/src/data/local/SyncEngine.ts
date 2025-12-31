import { getRealm } from '../core/security/RealmConfig';
import { NetworkSecurity } from '../core/security/NetworkSecurity';
import { SecureStorage } from '../core/security/Keychain';

/**
 * Sync Engine
 * Handles Offline-First data synchronization.
 * 1. Pushes local changes (pending_sync) to Backend.
 * 2. Pulls latest updates from Backend to Realm.
 */

export const SyncEngine = {
    /**
     * Start the synchronization process.
     * Should be called on app launch and network reconnect.
     */
    async syncData() {
        console.log('🔄 Starting Sync Process...');

        try {
            await this.pushLocalChanges();
            await this.pullRemoteUpdates();
            console.log('✅ Sync Completed Successfully');
        } catch (error) {
            console.error('❌ Sync Failed:', error);
        }
    },

    /**
     * Push local 'dirty' records to the API.
     */
    async pushLocalChanges() {
        const realm = await getRealm();
        // Example: Find objects marked for sync
        // const pendingUploads = realm.objects('Transaction').filtered('syncStatus == "PENDING"');

        // For POC, we simulate finding pending items
        const pendingUploads: any[] = [];

        if (pendingUploads.length === 0) {
            console.log('No local changes to push.');
            return;
        }

        console.log(`Pushing ${pendingUploads.length} local changes...`);

        for (const item of pendingUploads) {
            try {
                await NetworkSecurity.secureFetch('https://api.ecommerce.com/api/sync/upload', {
                    method: 'POST',
                    body: JSON.stringify(item),
                });

                // Update local status to SYNCED
                realm.write(() => {
                    item.syncStatus = 'SYNCED';
                    item.lastSyncedAt = new Date();
                });
            } catch (error) {
                console.error(`Failed to push item ${item.id}:`, error);
            }
        }
    },

    /**
     * Pull latest data from API.
     */
    async pullRemoteUpdates() {
        const lastSyncTime = await SecureStorage.get('last_sync_timestamp');
        const timestamp = lastSyncTime || '0';

        console.log(`Pulling updates since ${timestamp}...`);

        try {
            const response = await NetworkSecurity.secureFetch(`https://api.ecommerce.com/api/sync/download?since=${timestamp}`);
            // const data = await response.json();

            // Mock data
            const data = { changes: [], newTimestamp: new Date().toISOString() };

            if (data.changes.length > 0) {
                const realm = await getRealm();
                realm.write(() => {
                    // Apply changes to Realm
                    // data.changes.forEach(change => realm.create(change.type, change.data, Realm.UpdateMode.Modified));
                });
            }

            await SecureStorage.save('last_sync_timestamp', data.newTimestamp);
        } catch (error) {
            console.error('Failed to pull remote updates:', error);
            throw error;
        }
    }
};
