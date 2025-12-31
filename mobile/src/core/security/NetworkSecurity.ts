import { fetch } from 'react-native-ssl-pinning';

/**
 * Network Security Service
 * Implements SSL Pinning to prevent MITM attacks.
 */

// Define the domains and their public key hashes (SPKI)
// In production, these should be loaded from a secure config or env
// Define the domains and their public key hashes (SPKI)
// [SECURE-FIX] Placeholders removed. Config must be loaded from RemoteConfig or Build Env.
let pinningConfig: any = {};

export const NetworkSecurity = {
    /**
     * Initialize Pinning Configuration.
     * Must be called before any network requests.
     */
    initialize: (config: any) => {
        if (!config || !config['api.ecommerce.com']) {
            console.warn('NetworkSecurity: No SSL Pins provided. Defaulting to strict fail-safe.');
        }
        pinningConfig = config;
    },

    /**
     * Secure Fetch wrapper that enforces SSL Pinning.
     * Use this instead of the global fetch.
     */
    async secureFetch(url: string, options: any = {}) {
        try {
            // Validate initialization
            if (Object.keys(pinningConfig).length === 0) {
                throw new Error('NetworkSecurity not initialized with SSL Pins.');
            }

            // Extract domain from URL
            const domain = new URL(url).hostname;

            const response = await fetch(url, {
                ...options,
                timeoutInterval: 10000, // 10s timeout
                sslPinning: pinningConfig,
            });

            return response;
        } catch (error) {
            console.error('Secure Fetch Error (Possible MITM):', error);
            throw new Error('Network security check failed. Connection refused.');
        }
    },
};
