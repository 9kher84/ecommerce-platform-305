const crypto = require('crypto');

/**
 * Trace Integrity Module
 * Ensures Sovereign Traces are tamper-evident and cryptographically bound.
 */
class TraceIntegrity {
    static getSecret() {
        return process.env.JWT_SECRET || 'fallback-secret-DO-NOT-USE-IN-PROD';
    }

    /**
     * Generates a structural SHA-256 hash of the trace (content only).
     */
    static hash(traceData) {
        const content = JSON.stringify(traceData.trace || traceData); // Handle full wrapper or array
        return crypto.createHash('sha256').update(content).digest('hex');
    }

    /**
     * Signs the trace using HMAC-SHA256.
     * Guaranteed proof of origin from the Application Server.
     */
    static sign(traceData) {
        const content = JSON.stringify(traceData);
        // We incorporate a timestamp or entropy if possible, but traceData has meta.
        // If meta.generatedAt is present, it prevents replay/stale signing if we check it.
        const hmac = crypto.createHmac('sha256', this.getSecret());
        hmac.update(content);
        return hmac.digest('hex');
    }

    /**
     * Verifies the integrity of a signed trace.
     */
    static verify(traceData, signature) {
        const calculated = this.sign(traceData);
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(calculated));
    }
}

module.exports = TraceIntegrity;
