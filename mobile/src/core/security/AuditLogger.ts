import { NetworkSecurity } from './NetworkSecurity';

/**
 * Audit Logger
 * Logs critical financial transactions to a secure, write-only endpoint.
 * Ensures PCI DSS compliance by NOT logging sensitive card data (PAN).
 */

export interface AuditLogEntry {
    transactionId: string;
    action: 'INITIATE' | 'AUTHORIZE' | 'CAPTURE' | 'REFUND' | 'VOID';
    userId: string;
    amount: number;
    currency: string;
    status: 'SUCCESS' | 'FAILURE' | 'PENDING';
    timestamp: string;
    metadata?: Record<string, any>;
}

export const AuditLogger = {
    /**
     * Log a transaction securely.
     * @param entry The log entry details
     */
    async logTransaction(entry: AuditLogEntry): Promise<void> {
        // 1. Sanitize metadata to ensure NO PAN is present
        const sanitizedMetadata = this.sanitize(entry.metadata);

        const payload = {
            ...entry,
            metadata: sanitizedMetadata,
            timestamp: new Date().toISOString(),
        };

        try {
            // Send to secure audit endpoint
            await NetworkSecurity.secureFetch('https://api.ecommerce.com/api/audit/log', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Audit-Source': 'MobileApp',
                },
                body: JSON.stringify(payload),
            });
            console.log(`Audit Log Sent: ${entry.transactionId} - ${entry.action}`);
        } catch (error) {
            // If network fails, we MUST store this locally in encrypted storage 
            // and retry later. For POC, we just log error.
            console.error('Failed to send Audit Log:', error);
        }
    },

    /**
     * Removes sensitive keys from metadata.
     */
    sanitize(metadata?: Record<string, any>): Record<string, any> {
        if (!metadata) return {};
        const sensitiveKeys = ['pan', 'cvv', 'card_number', 'expiry', 'pin'];
        const clean = { ...metadata };

        for (const key of Object.keys(clean)) {
            if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
                clean[key] = '[REDACTED]';
            }
        }
        return clean;
    }
};
