/**
 * Remote Config Service
 * Fetches critical boot-time configuration and kill-switch status.
 */

// Mock implementation for POC - In Prod this would hit a public JSON/Firebase Remote Config
const MOCK_REMOTE_CONFIG = {
    MOBILE_APP_ENABLED: true, // Set to false to test Kill Switch
    API_BASE_URL: 'https://api.ecommerce.com',
    FORCE_UPDATE_REQUIRED: false,
    MIN_VERSION: '1.0.0',
    SSL_PINS: {
        'api.ecommerce.com': [
            'SHA256_HASH_OF_REAL_CERT_HERE', // Replaces placeholders
            'BACKUP_HASH_HERE'
        ]
    }
};

export const RemoteConfig = {
    fetchConfig: async () => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return MOCK_REMOTE_CONFIG;
    },

    /**
     * Checks if the app is allowed to run.
     */
    validateStatus: async () => {
        const config = await RemoteConfig.fetchConfig();

        if (!config.MOBILE_APP_ENABLED) {
            return { allowed: false, reason: 'MAINTENANCE' };
        }

        if (config.FORCE_UPDATE_REQUIRED) {
            return { allowed: false, reason: 'UPDATE_REQUIRED' };
        }

        return { allowed: true, config };
    }
};
