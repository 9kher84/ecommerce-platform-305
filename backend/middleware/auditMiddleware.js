const { AuditLog } = require("../sequelize_setup");

const auditMiddleware = (actionName) => {
  return async (req, res, next) => {
    if (process.env.NODE_ENV === "test") {
      return next();
    }

    // Capture original end function to log after response
    const originalEnd = res.end;

    res.end = async function (chunk, encoding) {
      // Restore original end
      res.end = originalEnd;
      res.end(chunk, encoding);

      try {
        if (req.user) {
          const logData = {
            userId: req.user.id,
            action: actionName || req.method + " " + req.originalUrl,
            ipAddress:
              req.ip ||
              req.headers["x-forwarded-for"] ||
              req.connection.remoteAddress,
            userAgent: req.headers["user-agent"],
            resourceType: "API_REQUEST",
            details: {
              statusCode: res.statusCode,
              method: req.method,
              url: req.originalUrl,
              body: req.method !== "GET" ? req.body : undefined,
            },
          };

          // Sanitize sensitive fields from log
          if (logData.details.body) {
            const sensitive = ["password", "token", "creditCard"];
            const bodyClone = { ...logData.details.body };
            sensitive.forEach((field) => {
              if (bodyClone[field]) bodyClone[field] = "***";
            });
            logData.details.body = bodyClone;
          }

          await AuditLog.create(logData);
        }
      } catch (error) {
        console.error("Audit Log Failed:", error);
      }
    };

    next();
  };
};

module.exports = auditMiddleware;

module.exports = auditMiddleware;
