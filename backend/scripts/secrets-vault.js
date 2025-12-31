const vault = require('node-vault');

/**
 * Ensures production secrets are properly configured
 * In production, VAULT_ADDR and VAULT_TOKEN MUST be set
 */
const ensureProductionSecrets = () => {
    if (process.env.NODE_ENV === 'production') {
        if (!process.env.VAULT_ADDR || !process.env.VAULT_TOKEN) {
            console.error('❌ [CRITICAL ERROR] In production: VAULT_ADDR and VAULT_TOKEN must be defined');
            console.error('⛔ FATAL: Cannot start without Vault configuration in production');
            process.exit(1);
        }
        console.log(`✅ [PRODUCTION] Connected to Vault: ${process.env.VAULT_ADDR}`);
    } else {
        console.log('⚠️  [DEVELOPMENT] Using .env - Vault will be required in production');
    }
};

// Initialize Vault Client
const vaultClient = vault({
    apiVersion: 'v1',
    endpoint: process.env.VAULT_ADDR || 'http://localhost:8200',
    token: process.env.VAULT_TOKEN || 'root-token-123'
});

const loadSecrets = async () => {
    try {
        console.log('🔐 Initializing Secrets from HashiCorp Vault...');

        // Check production requirements first
        ensureProductionSecrets();

        const secretPath = process.env.VAULT_SECRET_PATH || 'secret/data/ecommerce/prod';

        try {
            const result = await vaultClient.read(secretPath);
            if (result && result.data && result.data.data) {
                const secrets = result.data.data;
                Object.keys(secrets).forEach(key => {
                    process.env[key] = secrets[key];
                });
                console.log('✅ Secrets loaded from Vault successfully.');
                return;
            }
        } catch (vaultError) {
            console.warn(`⚠️  Could not connect to Vault at ${process.env.VAULT_ADDR || 'localhost'}: ${vaultError.message}`);

            // In production, Vault failure is FATAL
            if (process.env.NODE_ENV === 'production') {
                console.error('⛔ FATAL: Vault unreachable in Production.');
                console.error('🚨 System cannot start without Vault in production mode');
                process.exit(1);
            }

            console.log('ℹ️  [DEVELOPMENT] Falling back to environment variables');
        }

        // Development/Test fallback: verify critical secrets exist
        const criticalKeys = ['JWT_SECRET', 'ENCRYPTION_KEY', 'DB_PASSWORD'];
        const missing = criticalKeys.filter(k => !process.env[k]);

        if (missing.length > 0) {
            console.error(`❌ Critical secrets missing: ${missing.join(', ')}`);

            if (process.env.NODE_ENV === 'production') {
                console.error('⛔ FATAL: Missing critical secrets in production');
                process.exit(1);
            } else {
                console.warn('⚠️  WARNING: Missing secrets in development - application may not function correctly');
            }
        } else {
            console.log('✅ Secrets verified present (Environment/CI Injection).');
        }

    } catch (error) {
        console.error('❌ Vault Initialization Failed:', error);
        if (process.env.NODE_ENV === 'production') {
            console.error('⛔ FATAL: Cannot start in production without proper secret management');
            process.exit(1);
        }
    }
};

module.exports = loadSecrets;

