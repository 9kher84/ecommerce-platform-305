const winston = require('winston');
const path = require('path');

// Define log format
const logFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(metadata).length > 0) {
        msg += JSON.stringify(metadata);
    }
    return msg;
});

// Create Logger
const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'sovereign-backend' },
    transports: [
        // 1. Error Logs (Persistent)
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // 2. Combined Logs
        new winston.transports.File({
            filename: path.join(__dirname, '../logs/combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    ],
});

// If not in production, verify logs to console
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        ),
    }));
}

// Sovereign Alert Stream (Simulation of SMS/External Hook)
logger.alert = (message, payload = {}) => {
    logger.error(`🚨 SOVEREIGN ALERT: ${message}`, { ...payload, alert: true });
    console.error(`\x1b[41m\x1b[37m 🚨 SMS SENT: ${message} \x1b[0m`);
};

module.exports = logger;
