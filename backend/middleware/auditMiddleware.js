const { AuditLog } = require('../sequelize_setup');

const auditMiddleware = (actionName) => {
    return async (req, res, next) => {
        // Capture original end function to log after response
        const originalEnd = res.end;

        // We log after the response is sent to ensure we capture the status code
        // and don't block the response time significantly (fire and forget logic typically, 
        // but here we might accept slight delay for strict audit).

        // Actually, for strict audit, it's better to log *before* or *during* 
        // but typically we want to know if it succeeded.

        res.end = async function (chunk, encoding) {
            // Restore original end
            res.end = originalEnd;
            res.end(chunk, encoding);

            try {
                if (req.user) {
                    const logData = {
                        userId: req.user.id,
                        action: actionName || req.method + ' ' + req.originalUrl,
                        ipAddress: req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress,
                        userAgent: req.headers['user-agent'],
                        resourceType: 'API_REQUEST',
                        details: {
                            statusCode: res.statusCode,
                            method: req.method,
                            url: req.originalUrl,
                            body: req.method !== 'GET' ? req.body : undefined, // Be careful with sensitive data here!
                            // query: req.query
                        }
                    };

                    // Sanitize sensitive fields from log
                    if (logData.details.body) {
                        const sensitive = ['password', 'token', 'creditCard'];
                        const bodyClone = { ...logData.details.body };
                        sensitive.forEach(field => {
                            if (bodyClone[field]) bodyClone[field] = '***';
                        });
                        logData.details.body = bodyClone;
                    }

                    await AuditLog.create(logData);
                }
            } catch (error) {
                console.error('Audit Log Failed:', error);
                // Don't crash the request if audit fails, but log critical error
            }
        };

        next();
    };
};

module.exports = auditMiddleware;
