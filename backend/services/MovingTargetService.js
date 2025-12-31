const crypto = require('crypto');
const logger = require('../config/logger');

class MovingTargetDefense {
    constructor() {
        this.currentHeader = 'X-Sovereign-Token';
        this.validTokens = new Set();
        this.rotationInterval = 300000; // 5 minutes

        // Start rotation
        setInterval(() => this.rotateHeaders(), this.rotationInterval);
        this.rotateHeaders(); // Initial
    }

    rotateHeaders() {
        const randomSuffix = crypto.randomBytes(4).toString('hex');
        const timestamps = Date.now().toString();

        // Create a new unpredictable header name
        const newHeaderName = `X-Sov-${randomSuffix}-${timestamps.slice(-4)}`;

        // In a real distributed system, we would publish this to Redis/Vault
        // For this implementation, we simulate local state
        this.currentHeader = newHeaderName; // Update accepted header name

        logger.info(`🔄 Moving Target Defense: Header Rotated to [${this.currentHeader}]`);
    }

    getMiddleware() {
        return (req, res, next) => {
            // Allow bypassing for public endpoints if needed (e.g. login)
            // Checks if the request contains the specific header name required currently

            const headerValue = req.header(this.currentHeader);

            if (!headerValue && !req.path.startsWith('/public')) {
                logger.warn(`🛡️ Moving Target Defense: Request dropped. Missing header ${this.currentHeader}`);
                return res.status(418).json({ error: 'خطأ سيادي: البروتوكول غير متزامن' });
            }

            next();
        };
    }
}

module.exports = new MovingTargetDefense();
