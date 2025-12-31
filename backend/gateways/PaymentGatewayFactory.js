const MadaGateway = require('./MadaGateway');
const STCPayGateway = require('./STCPayGateway');
const ApplePayGateway = require('./ApplePayGateway');

/**
 * Payment Gateway Factory
 * Creates and manages payment gateway instances with Multi-Tenant support
 */

class PaymentGatewayFactory {
    constructor() {
        this.gateways = new Map();
        this.mode = process.env.NODE_ENV === 'production' ? 'live' : 'test';

        console.log(`🏭 Payment Gateway Factory initialized in ${this.mode.toUpperCase()} mode`);
    }

    /**
     * Get gateway instance by name
     * @param {string} gatewayName - Name of the gateway (mada, stc_pay, apple_pay)
     * @param {object} config - Optional gateway-specific configuration
     * @returns {PaymentGatewayInterface} - Gateway instance
     */
    getGateway(gatewayName, config = {}) {
        const normalizedName = gatewayName.toLowerCase();

        // Create cache key with config hash for multi-tenant support
        const cacheKey = `${normalizedName}_${this.getConfigHash(config)}`;

        // Return cached instance if exists
        if (this.gateways.has(cacheKey)) {
            return this.gateways.get(cacheKey);
        }

        // Create new gateway instance
        const gateway = this.createGateway(normalizedName, config);

        // Cache the instance
        this.gateways.set(cacheKey, gateway);

        return gateway;
    }

    /**
     * Generate hash for config (for multi-tenant caching)
     */
    getConfigHash(config) {
        if (!config || Object.keys(config).length === 0) {
            return 'default';
        }
        // Simple hash based on merchant IDs
        const keys = Object.values(config).filter(v => v).join('_');
        return keys.substring(0, 20);
    }

    /**
     * Create new gateway instance
     * @param {string} gatewayName - Gateway name
     * @param {object} config - Gateway configuration
     * @returns {PaymentGatewayInterface} - New gateway instance
     */
    createGateway(gatewayName, config) {
        const gatewayConfig = {
            mode: this.mode,
            ...config
        };

        switch (gatewayName) {
            case 'mada':
                return new MadaGateway(gatewayConfig);

            case 'stc_pay':
            case 'stcpay':
                return new STCPayGateway(gatewayConfig);

            case 'apple_pay':
            case 'applepay':
                return new ApplePayGateway(gatewayConfig);

            case 'test':
                // Return a test gateway for development
                return this.createTestGateway(gatewayConfig);

            default:
                throw new Error(`Unsupported payment gateway: ${gatewayName}`);
        }
    }

    /**
     * Create test gateway for development
     */
    createTestGateway(config) {
        // Use Mada gateway in test mode as default test gateway
        return new MadaGateway({ ...config, mode: 'test' });
    }

    /**
     * Get all available gateways
     * @returns {Array} - List of available gateway names
     */
    getAvailableGateways() {
        return [
            { name: 'mada', displayName: 'Mada', available: true },
            { name: 'stc_pay', displayName: 'STC Pay', available: true },
            { name: 'apple_pay', displayName: 'Apple Pay', available: true },
            { name: 'test', displayName: 'Test Gateway', available: this.mode === 'test' }
        ];
    }

    /**
     * Validate gateway configuration
     * @param {string} gatewayName - Gateway name
     * @returns {boolean} - True if configuration is valid
     */
    validateGatewayConfig(gatewayName) {
        try {
            const gateway = this.getGateway(gatewayName);
            return gateway.validateConfig();
        } catch (error) {
            console.error(`Gateway validation failed for ${gatewayName}:`, error.message);
            return false;
        }
    }

    /**
     * Clear cached gateway instances
     */
    clearCache() {
        this.gateways.clear();
        console.log('🧹 Payment gateway cache cleared');
    }

    /**
     * Get gateway statistics
     */
    getStatistics() {
        return {
            mode: this.mode,
            cachedGateways: Array.from(this.gateways.keys()),
            availableGateways: this.getAvailableGateways().filter(g => g.available).map(g => g.name)
        };
    }
}

// Export singleton instance
module.exports = new PaymentGatewayFactory();
