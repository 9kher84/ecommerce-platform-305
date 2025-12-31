const { AuditLog } = require('../sequelize_setup');

/**
 * AuditHelper (Phase 5.2 Audit Contract)
 * 
 * Enforces standardized, non-repudiable audit logging.
 * Should be called from Controllers or Transaction Boundaries.
 */
class AuditHelper {
    /**
     * Log a Critical Action
     * @param {Object} req - Express Request object (contains auth context)
     * @param {string} action - Canonical Action Verb (e.g. 'ACCEPT_QUOTE', 'LOGIN')
     * @param {Object} target - The Resource being affected
     * @param {string} target.type - Resource Type (e.g. 'PurchaseRequest')
     * @param {string} target.id - Resource UUID
     * @param {Object} [snapshots] - Optional Before/After states for forensics
     * @param {Object} [snapshots.before]
     * @param {Object} [snapshots.after]
     * @param {Object} [details] - Additional metadata
     */
    static async log(req, action, target, snapshots = {}, details = {}) {
        try {
            // 1. Resolve Actor Context (Safe Access)
            const auth = req.auth || {};
            const user = req.user || {};

            // Actor = The human/service actually doing it (or user if no delegation)
            // Principal = The identity being used (or user if no delegation)
            const actorId = auth.actor ? auth.actor.id : user.id;
            const principalId = auth.principal ? auth.principal.id : user.id;
            const delegationId = auth.delegation ? auth.delegation.id : null;

            // 2. Capture Environment
            const ipAddress = req.ip || req.connection.remoteAddress;
            const userAgent = req.headers['user-agent'];
            const contextSnapshot = user.context || null; // Capture Context (City/Team) at time of action

            // 3. Persist
            await AuditLog.create({
                action: action.toUpperCase(),
                targetType: target.type,
                targetId: target.id,
                resourceType: target.type, // Legacy Field capability
                resourceId: target.id,     // Legacy Field capability (String)
                userId: principalId,       // Legacy Field (maps to Principal usually)

                // Phase 5 Enhanced Fields
                principalId: principalId,
                actorId: actorId,
                delegationId: delegationId,

                context: contextSnapshot,
                details: {
                    ...details,
                    snapshots
                },
                ipAddress,
                userAgent
            });

        } catch (error) {
            // Falal Safety: Audit logging should not crash the main transaction?
            // "Audit must be reliable".
            // Ideally we queue this or retry. For now, we log error to stderr.
            console.error('[AUDIT FAILURE] Failed to write audit log:', error);
            // Depending on strictness, we might want to throw. 
            // Phase 5 says "Non-repudiable", implying if we can't log, maybe we shouldn't allow?
            // For now, keep availability prioritized but noisy failure.
        }
    }
}

module.exports = AuditHelper;
