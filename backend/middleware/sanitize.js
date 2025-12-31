const sanitize = (req, res, next) => {
    // Function to sanitize strings
    const sanitizeString = (str) => {
        if (typeof str !== 'string') return str;
        // Remove null bytes and common control characters that might be issues
        // Also simplistic SQL/HTML escaping can happen here if needed, 
        // but typically we rely on parameterized queries. 
        // We will remove typical NoSQL injection keys like $where or $regex if we were using Mongo,
        // but since we are using SQL (Sequelize), we focus on stripping dangerous characters or patterns 
        // if they are not expected.

        // For now, basic sanitization: remove null bytes
        return str.replace(/\0/g, '');
    };

    const sanitizeObject = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;

        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const value = obj[key];
                if (typeof value === 'string') {
                    obj[key] = sanitizeString(value);
                } else if (typeof value === 'object') {
                    sanitizeObject(value);
                }
            }
        }
        return obj;
    };

    if (req.body) sanitizeObject(req.body);
    if (req.query) sanitizeObject(req.query);
    if (req.params) sanitizeObject(req.params);

    next();
};

module.exports = sanitize;
