const vault = require('node-vault');
const logger = require('../config/logger');

class RealVaultManager {
    constructor() {
        this.client = vault({
            apiVersion: 'v1',
            endpoint: process.env.VAULT_ADDR || 'http://localhost:8200',
            token: process.env.VAULT_TOKEN
        });

        this.secretsCache = new Map();
        this.cacheTTL = 300000; // 5 دقائق
    }

    async getSecret(key) {
        if (this.secretsCache.has(key)) {
            const cached = this.secretsCache.get(key);
            if (Date.now() - cached.timestamp < this.cacheTTL) {
                return cached.value;
            }
        }

        try {
            const result = await this.client.read('secret/data/ecommerce/production');
            const secret = result.data.data[key];

            if (!secret) {
                throw new Error(`المفتاح السري ${key} غير موجود في Vault`);
            }

            // التخزين المؤقت
            this.secretsCache.set(key, {
                value: secret,
                timestamp: Date.now()
            });

            return secret;
        } catch (error) {
            logger.error(`❌ فشل جلب المفتاح السري من Vault: ${error.message}`);

            // في الإنتاج: توقف النظام
            if (process.env.NODE_ENV === 'production') {
                logger.fatal('🚨 نظام الإنتاج يتوقف بسبب فشل Vault');
                process.exit(1);
            }

            // في التطوير: استخدام .env مع تحذير صارم
            const envValue = process.env[key];
            if (envValue) {
                logger.warn(`⚠️ [DEVELOPMENT ONLY] استخدام ${key} من .env`);
                return envValue;
            }

            throw error;
        }
    }

    async rotateSecrets() {
        // دورة تدوير الأسرار تلقائياً
        const newSecrets = {
            JWT_SECRET: require('crypto').randomBytes(64).toString('hex'),
            ENCRYPTION_KEY: require('crypto').randomBytes(32).toString('hex')
        };

        await this.client.write('secret/data/ecommerce/production', {
            data: newSecrets
        });

        this.secretsCache.clear();
        logger.info('✅ تم تدوير الأسرار في Vault');
    }
}

module.exports = new RealVaultManager();
