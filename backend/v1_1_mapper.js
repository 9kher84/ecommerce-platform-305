const fs = require('fs');
const path = require('path');

const rootDir = __dirname;

const aggregates = ['PurchaseRequest', 'Quotation', 'Award', 'Deal', 'PurchaseOrder', 'Invoice', 'Organization', 'User', 'Product'];
const mapping = {};

// Initialize mapping
aggregates.forEach(agg => {
  mapping[agg] = {
    models: [],
    repositories: [],
    services: [],
    controllers: [],
    routes: [],
    graphql: [],
    tables: [],
    migrations: [],
    tests: [],
    consumers: [],
    producers: []
  };
});

function scanDir(dir, typeStr) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory() && file !== 'node_modules' && file !== '.git') {
      scanDir(fullPath, typeStr);
    } else if (file.endsWith('.js') || file.endsWith('.ts')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const relPath = fullPath.replace(rootDir, '').replace(/\\/g, '/');
      
      for (const agg of aggregates) {
        const regex = new RegExp(`\\b${agg}\\b`, 'i');
        if (regex.test(content) || regex.test(file)) {
          if (relPath.includes('/models')) mapping[agg].models.push(relPath);
          else if (relPath.includes('/repositories')) mapping[agg].repositories.push(relPath);
          else if (relPath.includes('/services')) mapping[agg].services.push(relPath);
          else if (relPath.includes('/controllers')) mapping[agg].controllers.push(relPath);
          else if (relPath.includes('/routes')) mapping[agg].routes.push(relPath);
          else if (relPath.includes('/graphql') || relPath.includes('/resolvers')) mapping[agg].graphql.push(relPath);
          else if (relPath.includes('/migrations')) mapping[agg].migrations.push(relPath);
          else if (relPath.includes('/test') || file.includes('.test.')) mapping[agg].tests.push(relPath);
        }
      }
    }
  }
}

scanDir(rootDir);

// Generate Markdown
const md = [];
md.push('# 🏗️ ARCHITECTURE GOVERNANCE PACKAGE v1.1');
md.push('> Moving from Architecture-Only to Implementation Traceability. This document bridges the gap between Bounded Contexts and real-world codebase files.');
md.push('');

// --- TASK 1: CURRENT REALITY MAPPING ---
md.push('## TASK 1: Current Reality Mapping');
for (const agg of aggregates) {
  md.push(`### Aggregate: \`${agg}\``);
  md.push(`- **Current Models:** ${mapping[agg].models.length ? mapping[agg].models.map(f => `\`${f}\``).join(', ') : '*None found*'}`);
  md.push(`- **Current Repositories:** ${mapping[agg].repositories.length ? mapping[agg].repositories.map(f => `\`${f}\``).join(', ') : '*None found*'}`);
  md.push(`- **Current Services:** ${mapping[agg].services.length ? mapping[agg].services.map(f => `\`${f}\``).join(', ') : '*None found*'}`);
  md.push(`- **Current Controllers:** ${mapping[agg].controllers.length ? mapping[agg].controllers.map(f => `\`${f}\``).join(', ') : '*None found*'}`);
  md.push(`- **Current Routes:** ${mapping[agg].routes.length ? mapping[agg].routes.map(f => `\`${f}\``).join(', ') : '*None found*'}`);
  md.push(`- **Current GraphQL Resolvers:** ${mapping[agg].graphql.length ? mapping[agg].graphql.map(f => `\`${f}\``).join(', ') : '*None found*'}`);
  md.push(`- **Current Migrations:** ${mapping[agg].migrations.length ? mapping[agg].migrations.map(f => `\`${f}\``).join(', ') : '*None found*'}`);
  md.push(`- **Current Tests:** ${mapping[agg].tests.length ? mapping[agg].tests.map(f => `\`${f}\``).join(', ') : '*None found*'}`);
  md.push('');
}

// --- TASK 2: GAP ANALYSIS ---
md.push('## TASK 2: Gap Analysis');
md.push('| Aggregate | Current State | Target State | Gap | Priority | Risk | Estimated Effort |');
md.push('|---|---|---|---|---|---|---|');
md.push('| **PurchaseRequest** | Scattered logic in Controller. Child items mutated directly. | Pure Domain Service. Items mutated ONLY via PR. | Lack of strict Root boundaries. | 🔴 High | High (Data consistency) | 5 Days |');
md.push('| **Quotation** | Tightly coupled to PR sync. No Deal context. | Async generation. Owns QuotationItems. | Sync coupling. | 🔴 High | Medium | 3 Days |');
md.push('| **Invoice** | Relies on PurchaseOrder. | Relies ONLY on Deal. | Structural FK dependency incorrect. | 🟡 Medium | High (Billing impact) | 7 Days |');
md.push('| **User** | Cross-domain mutations. High file usage. | IAM Context only. Accessed via API/ACL. | Excessive direct DB reads from other domains. | 🔴 Critical | High (Security) | 14 Days |');
md.push('');

// --- TASK 3: REPOSITORY OWNERSHIP ---
md.push('## TASK 3: Repository Ownership & Allowed Methods');
md.push('Child repositories (e.g., `PurchaseRequestItemRepository`) **MUST BE DELETED**. All access goes through the Root.');
md.push('');
md.push('### `PurchaseRequestRepository`');
md.push('- **Allowed:** `Create(PR)`, `Update(PR)`, `Publish(PR)`, `Cancel(PR)`, `FindById(Id)`, `FindDrafts()`.');
md.push('- **Forbidden:** `UpdateItem()`, `DeleteItem()` (Items must be replaced in bulk via `Update(PR)`).');
md.push('');

// --- TASK 4: SERVICE OWNERSHIP ---
md.push('## TASK 4: Service Ownership Matrix');
md.push('| Service | Owner Domain | Allowed Dependencies | Forbidden Dependencies | Public Interface | Internal Interface |');
md.push('|---|---|---|---|---|---|');
md.push('| `RequestService` | Procurement | `IdentityAPI`, `CatalogAPI` | `FinanceDB`, `SourcingDB` | `createRequest`, `publishRequest` | `validateItems` |');
md.push('| `QuotationService` | Sourcing | `ProcurementAPI` | `FulfillmentDB` | `submitQuote`, `awardQuote` | `calculateQuoteTax` |');
md.push('| `InvoiceService` | Finance | `FulfillmentAPI` | `ProcurementDB`, `CatalogDB` | `generateInvoice` | `applyCommission` |');
md.push('');

// --- TASK 5: EVENT CONTRACTS ---
md.push('## TASK 5: Event Contracts (Standardized Definitions)');
md.push('### `RequestPublishedEvent`');
md.push('- **Version:** `v1.0`');
md.push('- **Payload Schema:** `{ eventId: UUID, requestId: UUID, buyerId: UUID, timestamp: ISO8601 }`');
md.push('- **Producer:** Procurement Domain');
md.push('- **Consumers:** Communication, Decision Support, Observability');
md.push('- **Ordering Guarantee:** At-least-once, unordered (Consumers must handle).');
md.push('- **Retry Strategy:** Exponential Backoff (Max 5 retries).');
md.push('- **Idempotency Key:** `eventId`');
md.push('- **Dead Letter Strategy:** Route to DLQ after 5 failures. Alert Admin.');
md.push('- **Retention:** 30 Days (Hot), 7 Years (Cold Archive).');
md.push('- **Replay Policy:** Supported via EventLog.');
md.push('- **Backward Compatibility:** Additive changes only. Breaking changes require `v2.0`.');
md.push('');

// --- TASK 6: TRANSACTION SPECIFICATION ---
md.push('## TASK 6: Transaction Specification');
md.push('### Scenario: Accept Quotation (Award)');
md.push('```text');
md.push('BEGIN TRANSACTION');
md.push('  Validation Order:');
md.push('    1. Quotation is PENDING.');
md.push('    2. PurchaseRequest is PUBLISHED.');
md.push('  Lock Strategy: SELECT FOR UPDATE (Pessimistic on Quotation).');
md.push('  Isolation Level: READ COMMITTED.');
md.push('  Operations:');
md.push('    1. UPDATE Quotation SET Status = ACCEPTED;');
md.push('    2. INSERT Award;');
md.push('    3. UPDATE PurchaseRequest SET Status = AWARDED;');
md.push('COMMIT');
md.push('  Compensation: N/A (Atomic Rollback if fails).');
md.push('  Timeout: 5000ms.');
md.push('AFTER COMMIT (Async/Events):');
md.push('  1. Emit `QuotationAwardedEvent`.');
md.push('```');
md.push('');

// --- TASK 7: AGGREGATE VERIFICATION ---
md.push('## TASK 7: Aggregate Verification');
md.push('### Aggregate: `PurchaseRequest`');
md.push('- **Can another Aggregate reference it?** Yes, by `requestId` (UUID) only. No direct DB Join allowed.');
md.push('- **Can another Aggregate modify it?** No. Only `RequestService` can modify it.');
md.push('- **Can another Aggregate delete it?** No.');
md.push('- **Can another Aggregate create children?** No. (No direct inserts to `PurchaseRequestItem`).');
md.push('- **Allowed navigation:** PR -> Items. Items cannot navigate back to PR via DB ORM relations outside the repository.');
md.push('- **Allowed lifecycle:** DRAFT -> PUBLISHED -> AWARDED -> CLOSED.');
md.push('');

// --- TASK 8: API CONTRACTS ---
md.push('## TASK 8: API Contracts');
md.push('### API: `POST /api/procurement/requests`');
md.push('- **Input DTO:** `{ title: string, items: [{ productId, qty }] }`');
md.push('- **Output DTO:** `{ id: UUID, status: DRAFT, createdAt: string }`');
md.push('- **Errors:** `400 BAD_REQUEST (Invalid Items)`, `401 UNAUTHORIZED`.');
md.push('- **Authorization:** Requires `Buyer` role context.');
md.push('- **Idempotency:** Required (Header: `X-Idempotency-Key`).');
md.push('- **Validation Rules:** Items > 0. Qty > 0.');
md.push('- **Version:** `v1`');
md.push('');

// --- TASK 9: MIGRATION STRATEGY ---
md.push('## TASK 9: Database Migration Strategy');
md.push('### Phase 1: Aggregate Isolation (e.g. PurchaseRequest)');
md.push('- **Phase:** Dual-Write & ACL setup.');
md.push('- **Old Structure:** Direct mutation via random controllers.');
md.push('- **New Structure:** Encapsulated in `PurchaseRequestRepository`.');
md.push('- **Compatibility Layer:** Expose temporary local facade for legacy controllers.');
md.push('- **Rollback:** Disable feature flag, fallback to direct ORM mutation.');
md.push('- **Data Migration:** None required for this phase (Logic change only).');
md.push('- **Feature Flag:** `ENABLE_NEW_PR_AGGREGATE`.');
md.push('- **Cutover:** Route all `req` traffic to new Domain Service.');
md.push('- **Cleanup:** Delete legacy ORM calls and child repositories.');
md.push('');

// --- TASK 10: ARCHITECTURE METRICS ---
md.push('## TASK 10: Measurable Architecture Metrics (KPIs)');
md.push('The architecture is only accepted if these metrics improve across Sprints:');
md.push('- **Maximum Aggregate Size:** < 50 child entities per root (Protects RAM/DB Locks).');
md.push('- **Maximum Transaction Duration:** < 50ms.');
md.push('- **Maximum Synchronous Cross-Domain Calls:** 0 (Strictly Pub/Sub or ACL caches).');
md.push('- **Maximum Event Latency:** < 500ms (Publish to Consume).');
md.push('- **Coupling Score (Incoming FKs across domains):** Must decrease by 80%.');
md.push('- **Repository Count:** Must equal exact number of Aggregate Roots (Reduction of ~40%).');
md.push('- **Service Count:** Aligned 1:1 with Business Capabilities.');
md.push('');

fs.writeFileSync('WAVE_1_1_ARCHITECTURE_GOVERNANCE_PACKAGE.md', md.join('\n'));
console.log('v1.1 Generated.');
process.exit(0);
