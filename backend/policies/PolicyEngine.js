const registry = require('./index');

class PolicyEngine {
    /**
     * Determines if an action is allowed based on the Policy Registry.
     * @param {Object} user - User object with Context loaded.
     * @param {Object} resource - Target resource.
     * @param {string} resourceType - Type key (e.g., 'Request').
     * @param {string} action - Action (view, update, delete).
     * @returns {Promise<boolean> | boolean}
     */
    static allows(user, resource, resourceType, action = 'view') {
        const policy = registry[resourceType];
        if (!policy) {
            console.warn(`PolicyEngine: No policy found for resource type '${resourceType}'`);
            return false; // Default Secure: Deny if unknown
        }

        return policy(user, resource, action);
    }

    /**
     * Deep Trace policy evaluation (Rule-Based V2)
     * Returns a detailed timeline of rule evaluation.
     */
    /**
     * Deep Trace policy evaluation (Rule-Based V2.1)
     * Returns a detailed timeline of rule evaluation.
     * Compliant with Phase 2.1 Mandates: SKIPPED rules visibility & Standardized Schema.
     */
    /**
     * Deep Trace policy evaluation (Rule-Based V2.2)
     * Integrity: Input Classification & Ghost Detection.
     */
    /**
     * Deep Trace policy evaluation (Sovereign Schema v1.0)
     * Phase 2.3: Chaos Ready & Canonical Compliance.
     */
    static trace(user, resource, resourceType, action) {
        const crypto = require('crypto');
        let ruleIndex = 0;
        const timeline = [];
        const violations = [];
        let contextStatus = 'VALID';

        // Helper: Classify & Analyze Input
        const classify = (field, value, expectedType = 'string') => {
            if (value === undefined || value === null) return { value: 'null', status: 'MISSING' };

            // Type Check
            const receivedType = Array.isArray(value) ? 'array' : typeof value;
            if (receivedType !== expectedType && expectedType !== 'any') {
                violations.push({ field, expectedType, receivedType, severity: 'HIGH' });
                contextStatus = 'MALFORMED';
            }

            // Poison Check (Basic injection signatures)
            const strVal = String(value);
            if (strVal.includes("'--") || strVal.includes("<script>") || strVal.includes("UNION SELECT")) {
                violations.push({ field, expectedType, receivedType, severity: 'CRITICAL', reason: 'Injection Pattern' });
                contextStatus = 'POISONED';
                return { value: strVal, status: 'POISONED' };
            }
            return { value: strVal, status: 'VALID' };
        };

        // 1. Layer: Sovereign Bypass (Rule #0)
        const ownerId = process.env.OWNER_ID || '11111111-1111-1111-1111-111111111111';
        const isOwnerIDMatch = user.id === ownerId;

        // Validation of Inputs for Context Analysis
        const actorIdInput = classify('actor.id', user.id, 'string');
        const ownerEnvInput = classify('process.env.OWNER_ID', ownerId, 'string');

        // Ghost Owner / Spoof Check
        // If user claims to be Owner in payload context but Auth Actor ID differs?
        // Actually, 'user' arg IS the Actor. 
        // If Actor ID == OwnerID, we assume Sovereign.

        timeline.push({
            index: ruleIndex++,
            ruleId: 'OWNER_BYPASS',
            ruleType: 'SOVEREIGN', // Schema: type
            priority: 0,
            evaluated: true,
            result: isOwnerIDMatch ? 'PASS' : 'FAIL',
            decisionImpact: isOwnerIDMatch ? 'ALLOWING' : 'NEUTRAL',
            expression: 'user.id === process.env.OWNER_ID',
            inputs: {
                'user.id': actorIdInput,
                'process.env.OWNER_ID': ownerEnvInput
            }
        });

        // 2. Policy Lookup & Evaluation
        const policy = registry[resourceType];

        if (contextStatus === 'POISONED') {
            // 2a. Poisoned Context = Auto Deny
            return this._packTrace(user, resource, resourceType, action, 'DENY', timeline, contextStatus, violations);
        }

        if (isOwnerIDMatch) {
            // Sovereign: Skip remaining rules but log them
            if (policy && policy.rules) {
                policy.rules.forEach((rule, idx) => {
                    const relevant = rule.actions.includes('*') || rule.actions.includes(action);
                    if (relevant) {
                        timeline.push({
                            index: ruleIndex++,
                            ruleId: rule.id,
                            ruleType: rule.actions.includes('*') ? 'CONSTRAINT' : 'PERMISSION',
                            priority: 1000 + idx,
                            evaluated: false,
                            result: 'SKIPPED',
                            decisionImpact: 'NONE',
                            expression: rule.expression || 'n/a',
                            inputs: {}
                        });
                    }
                });
            }
            return this._packTrace(user, resource, resourceType, action, 'ALLOW', timeline, contextStatus, violations);
        }

        if (!policy) {
            timeline.push({
                index: ruleIndex++,
                ruleId: 'POLICY_EXISTENCE',
                ruleType: 'SYSTEM',
                priority: 1,
                evaluated: true,
                result: 'FAIL',
                decisionImpact: 'BLOCKING',
                expression: '!!registry[resourceType]',
                inputs: { resourceType: classify('resourceType', resourceType) }
            });
            return this._packTrace(user, resource, resourceType, action, 'DENY', timeline, contextStatus, violations);
        }

        // 3. Regular Evaluation
        if (policy.rules) {
            // A. Constraints
            const constraints = policy.rules.filter(r => r.actions.includes('*'));
            for (const rule of constraints) {
                const passed = rule.check(user, resource);
                timeline.push({
                    index: ruleIndex++,
                    ruleId: rule.id,
                    ruleType: 'CONSTRAINT',
                    priority: 1000,
                    evaluated: true,
                    result: passed ? 'PASS' : 'FAIL',
                    decisionImpact: passed ? 'NEUTRAL' : 'BLOCKING',
                    expression: rule.expression || 'n/a',
                    inputs: {
                        'user.context': classify('user.context', user.context, 'any'),
                        'resource.city': classify('resource.city', resource ? resource.cityId : null, 'any')
                    }
                });
                if (!passed) return this._packTrace(user, resource, resourceType, action, 'DENY', timeline, contextStatus, violations);
            }

            // B. Permissions
            const permissions = policy.rules.filter(r => r.actions.includes(action) && !r.actions.includes('*'));

            if (permissions.length === 0) {
                timeline.push({
                    index: ruleIndex++,
                    ruleId: 'NO_MATCHING_RULES',
                    ruleType: 'SYSTEM',
                    priority: 9999,
                    evaluated: true,
                    result: 'FAIL',
                    decisionImpact: 'BLOCKING',
                    expression: 'matches(action)',
                    inputs: {}
                });
                return this._packTrace(user, resource, resourceType, action, 'DENY', timeline, contextStatus, violations);
            }

            for (const rule of permissions) {
                const passed = rule.check(user, resource);
                timeline.push({
                    index: ruleIndex++,
                    ruleId: rule.id,
                    ruleType: 'PERMISSION',
                    priority: 1000,
                    evaluated: true,
                    result: passed ? 'PASS' : 'FAIL',
                    decisionImpact: passed ? 'ALLOWING' : 'NEUTRAL',
                    expression: rule.expression || 'n/a',
                    inputs: {
                        userId: classify('userId', user.id, 'string'),
                        resourceOwner: classify('resourceUserId', resource?.userId, 'string')
                    }
                });

                if (passed) return this._packTrace(user, resource, resourceType, action, 'ALLOW', timeline, contextStatus, violations);
            }

            // Implicit Deny
            timeline.push({
                index: ruleIndex++,
                ruleId: 'FINAL_DEFAULT',
                ruleType: 'SYSTEM',
                priority: 10000,
                evaluated: true,
                result: 'FAIL',
                decisionImpact: 'BLOCKING',
                expression: 'implicit_deny',
                inputs: {}
            });
            return this._packTrace(user, resource, resourceType, action, 'DENY', timeline, contextStatus, violations);

        } else {
            // Legacy Fallback
            const allowed = policy(user, resource, action);
            timeline.push({
                index: ruleIndex++,
                ruleId: 'LEGACY_OPAQUE',
                ruleType: 'LEGACY',
                priority: 5000,
                evaluated: true,
                result: allowed ? 'PASS' : 'FAIL',
                decisionImpact: allowed ? 'ALLOWING' : 'BLOCKING',
                expression: 'opaque_function',
                inputs: {}
            });
            return this._packTrace(user, resource, resourceType, action, allowed ? 'ALLOW' : 'DENY', timeline, contextStatus, violations);
        }
    }

    // Helper to Pack Schema v1.0
    static _packTrace(actor, resource, resourceType, action, decision, timeline, contextStatus, violations) {
        const crypto = require('crypto');
        const policy = registry[resourceType];
        // Dynamic Versioning
        const policyVer = (policy && policy.version) ? policy.version : `${resourceType}Policy@latest`;

        return {
            traceId: crypto.randomUUID(),
            traceVersion: "1.0", // Canonical
            decision: decision,
            actor: {
                id: actor.id,
                type: (actor.id === process.env.OWNER_ID) ? 'OWNER' : 'USER'
            },
            principal: {
                id: actor.id, // In Phase 2, Actor IS Principal (no delegation yet)
                delegationId: null
            },
            resource: {
                type: resourceType,
                id: resource ? resource.id : 'null',
                snapshot: resource ? { id: resource.id, status: resource.status } : {}
            },
            action: action,
            timeline: timeline,
            contextAnalysis: {
                status: contextStatus,
                violations: violations
            },
            integrity: {
                // To be filled by Controller/Integrity Utils
                signed: false
            },
            meta: {
                policyVersion: policyVer,
                engineVersion: 'PolicyEngine@2.3.1',
                environment: process.env.NODE_ENV || 'development',
                generatedAt: new Date().toISOString()
            }
        };
    }
}

module.exports = PolicyEngine;
