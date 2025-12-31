const { DataTypes } = require('sequelize');
const sovereignKillSwitch = require('../scripts/kill-switch');
const logger = require('../config/logger');

const triggerTrap = async (modelName, action, details) => {
    logger.fatal(`🚨 HONEYPOT TRIGGERED: Model ${modelName} accessed via ${action}`);
    await sovereignKillSwitch.detectThreat({
        type: 'HONEYPOT_TRIGGERED',
        source: 'Database',
        details: { modelName, action, ...details }
    });
    // Force immediate activation for honeypots
    await sovereignKillSwitch.activateKillSwitch();
};

module.exports = (sequelize) => {
    const trapHooks = {
        beforeFind: (options) => triggerTrap('AdminCredentialsBackup', 'SELECT', options),
        beforeCreate: (instance) => triggerTrap('AdminCredentialsBackup', 'INSERT', instance),
        beforeUpdate: (instance) => triggerTrap('AdminCredentialsBackup', 'UPDATE', instance),
        beforeDestroy: (instance) => triggerTrap('AdminCredentialsBackup', 'DELETE', instance),
        beforeBulkCreate: () => triggerTrap('AdminCredentialsBackup', 'BULK_INSERT', {}),
        beforeBulkUpdate: () => triggerTrap('AdminCredentialsBackup', 'BULK_UPDATE', {})
    };

    const AdminCredentialsBackup = sequelize.define('AdminCredentialsBackup', {
        username: { type: DataTypes.STRING, defaultValue: 'admin_root' },
        password_hash: { type: DataTypes.STRING, defaultValue: '$2b$10$FakeHashForHoneypotTrap123456' },
        recovery_key: { type: DataTypes.STRING, defaultValue: 'prod-recovery-key-999' },
        last_login: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    }, {
        tableName: 'admin_credentials_backup',
        timestamps: false,
        hooks: trapHooks
    });

    const PaymentGatewayKeys = sequelize.define('PaymentGatewayKeys', {
        provider: { type: DataTypes.STRING, defaultValue: 'STRIPE_PROD' },
        api_key: { type: DataTypes.STRING, defaultValue: 'sk_live_fake_honeypot_key_999' },
        secret_key: { type: DataTypes.STRING, defaultValue: 'whsec_fake_honeypot_secret_888' }
    }, {
        tableName: 'payment_gateway_keys',
        timestamps: false,
        hooks: {
            beforeFind: () => triggerTrap('PaymentGatewayKeys', 'SELECT', {}),
            // ... mapped similarly
        }
    });

    return { AdminCredentialsBackup, PaymentGatewayKeys };
};
