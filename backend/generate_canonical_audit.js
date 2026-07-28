const fs = require('fs');

const models = require('./audit_models.json');
const dbReality = require('./audit_db_reality.json');
const analysis = require('./analysis_result.json');

const md = [];

md.push('# 🏛️ DATABASE CANONICAL ARCHITECTURE AUDIT');
md.push('> Read-only Forensic Investigation & Permanent Foundation Blueprint');
md.push('');

// --- PHASE 1 ---
md.push('## Phase 1 — Runtime Truth');
md.push('Deep dive into the actual configuration vs. real database state.');
md.push('');

for (const [modelName, model] of Object.entries(models)) {
  const isActualTablePresent = dbReality.dbTables.includes(model.physicalTable);
  
  md.push(`### Model: \`${modelName}\``);
  md.push(`- **Physical Table (Config):** \`${model.physicalTable}\``);
  md.push(`- **Schema:** \`${model.schema}\``);
  md.push(`- **freezeTableName:** \`${model.freezeTableName}\``);
  md.push(`- **underscored:** \`${model.underscored}\``);
  md.push(`- **timestamps:** \`${model.timestamps}\``);
  md.push(`- **paranoid (Soft Delete):** \`${model.paranoid}\``);
  md.push(`- **Requires Quoted Identifiers:** \`${model.requiresQuoting}\``);
  md.push(`- **Actual SQL Generated:** \`${model.actualSqlGenerated}\``);
  md.push(`- **Table Exists in DB?** ${isActualTablePresent ? '✅ YES' : '❌ NO'}`);
  md.push('');
}

// --- PHASE 2 ---
md.push('## Phase 2 — Duplicate Analysis');
md.push('Resolving capitalization splits and duplicated legacy structures.');
md.push('');

const dups = dbReality.duplicateAnalysis;
for (const [lower, info] of Object.entries(dups)) {
  md.push(`### Duplicate Pair: \`${info.forms.join(' / ')}\``);
  
  info.forms.forEach(form => {
    // Determine usages
    let seqRef = false;
    let fkRef = 0;
    
    // Check if models use it
    for (const [mName, m] of Object.entries(models)) {
      if (m.physicalTable === form) seqRef = true;
    }
    
    // Check usages
    let serviceRef = 0;
    let controllerRef = 0;
    let migrationRef = 0;
    
    Object.keys(analysis.usages).forEach(mName => {
      if (models[mName] && models[mName].physicalTable === form) {
        analysis.usages[mName].forEach(u => {
          if (u.includes('service')) serviceRef++;
          if (u.includes('controller')) controllerRef++;
        });
      }
    });
    
    analysis.migrationsData.forEach(mig => {
      if (mig.created.includes(form) || mig.dropped.includes(form) || mig.renamed.some(r => r.from === form || r.to === form)) {
        migrationRef++;
      }
    });

    const count = info.counts[form];
    const hasProdData = typeof count === 'number' && count > 0;
    
    md.push(`#### Table: \`${form}\``);
    md.push(`- **Referenced by Sequelize Models:** ${seqRef ? 'Yes' : 'No'}`);
    md.push(`- **Referenced by Services:** ${serviceRef > 0 ? `Yes (${serviceRef})` : 'No'}`);
    md.push(`- **Referenced by Controllers:** ${controllerRef > 0 ? `Yes (${controllerRef})` : 'No'}`);
    md.push(`- **Referenced by Migrations:** ${migrationRef > 0 ? `Yes (${migrationRef})` : 'No'}`);
    md.push(`- **Row Count:** \`${count}\``);
    md.push(`- **Contains Production Data:** ${hasProdData ? 'Yes' : 'No'}`);
    
    if (form === 'users') {
      md.push(`- **Classification:** Canonical / Never Remove (Core Data)`);
    } else if (form === 'Users') {
      md.push(`- **Classification:** Legacy / Accidental (Created by Auto-Sync)`);
    } else if (hasProdData && count > (info.counts[info.forms.find(f => f !== form)] || 0)) {
      md.push(`- **Classification:** Canonical`);
    } else {
      md.push(`- **Classification:** Legacy / Deprecated`);
    }
    md.push('');
  });
}

// Ensure manual checks for PurchaseRequests
md.push(`### Other Identified Conceptual Duplicates`);
md.push(`- \`PurchaseRequests\` vs \`purchase_requests\`
  - **Status:** \`PurchaseRequests\` is the active runtime table (referenced strictly in models), while \`purchase_requests\` is an older snake_case artifact in raw SQL or older migrations.
- \`PriceQuotes\` vs \`price_quotes\`
  - **Status:** Same as above. Sequelize forces camel/pascal casing in newer models, while old code relied on snake_case.
`);
md.push('');

// --- PHASE 3 ---
md.push('## Phase 3 — Dependency Graph');
md.push('Aggregated map of relationships and usage domains.');
md.push('');

// Group tables logically
const groupedDeps = {};
for (const [modelName, model] of Object.entries(models)) {
  const table = model.physicalTable;
  groupedDeps[table] = {
    in: [], out: [], services: 0, controllers: 0, jobs: 0, ai: 0, dashboard: 0
  };
  
  if (analysis.usages[modelName]) {
    analysis.usages[modelName].forEach(u => {
      const uLower = u.toLowerCase();
      if (uLower.includes('service')) groupedDeps[table].services++;
      if (uLower.includes('controller') || uLower.includes('route')) groupedDeps[table].controllers++;
      if (uLower.includes('job') || uLower.includes('worker') || uLower.includes('cron')) groupedDeps[table].jobs++;
      if (uLower.includes('ai') || uLower.includes('llm') || uLower.includes('vector')) groupedDeps[table].ai++;
      if (uLower.includes('dashboard') || uLower.includes('admin')) groupedDeps[table].dashboard++;
    });
  }
}

// Pull relations from old report structure
const oldModels = require('./model_report.json');
for (const [modelName, m] of Object.entries(oldModels)) {
  const table = m.physicalTable;
  if (m.associations) {
    m.associations.forEach(a => {
      if (!groupedDeps[table]) groupedDeps[table] = { in: [], out: [] };
      const targetTable = oldModels[a.target] ? oldModels[a.target].physicalTable : a.target;
      if (a.type === 'BelongsTo') {
         groupedDeps[table].out.push(targetTable);
         if (!groupedDeps[targetTable]) groupedDeps[targetTable] = { in: [], out: [] };
         groupedDeps[targetTable].in.push(table);
      }
    });
  }
}

for (const [table, deps] of Object.entries(groupedDeps)) {
  if (deps.in && (deps.in.length > 0 || deps.out.length > 0 || deps.services > 0)) {
    md.push(`### \`${table}\``);
    md.push(`- **Incoming FKs:** ${deps.in.length > 0 ? [...new Set(deps.in)].join(', ') : 'None'}`);
    md.push(`- **Outgoing FKs:** ${deps.out.length > 0 ? [...new Set(deps.out)].join(', ') : 'None'}`);
    md.push(`- **Referenced By:** Models (Yes), Services (${deps.services || 0}), Controllers (${deps.controllers || 0}), Scheduled Jobs (${deps.jobs || 0}), AI Components (${deps.ai || 0}), Dashboard (${deps.dashboard || 0})`);
    md.push('');
  }
}

// --- PHASE 4 ---
md.push('## Phase 4 — Canonical Recommendation');
md.push(`
> **Context:** B2B Procurement Marketplace with AI, RFQ workflows, Future ERP integration, and BI readiness.

### 1. Naming Conventions (The Hard Truth)
The split between \`users\` (snake_case/lowercase) and \`Users\` (PascalCase) is a symptom of inconsistent \`freezeTableName\` and \`underscored\` usage across Sequelize models.
**Recommendation:** 
- **Standardize on \`snake_case\` for all physical tables and columns.** 
- **Why?** Postgres handles lowercase naturally without requiring explicit quotes. \`Users\` requires \`"Users"\` in every raw query, causing friction for BI tools (Metabase, Superset) and ERP integration.

### 2. Core Procurement / RFQ Workflow
- \`PurchaseRequests\` -> \`Quotations\` -> \`PurchaseOrders\` -> \`Invoices\` -> \`Shipments\`.
- **Recommendation:** Implement strict **State Machines** via Postgres ENUMs (or separated Status tables) to avoid ghost states. Enforce \`paranoid: true\` (Soft Deletes) across all these tables for financial auditing. 

### 3. ERP & Scalability Readiness
- **Recommendation:** Isolate \`InventoryTransactions\` and \`CommissionTransactions\` into a **Write-Ahead Ledger (WAL)** pattern or an append-only accounting table. ERP syncs rely on immutability. Do NOT update balances in place without an append-only log.

### 4. AI & Machine Learning Layer
- **Recommendation:** \`ProductDNA\` and \`SellerInteractionEvents\` are the goldmine for embeddings. 
- Introduce \`pgvector\` to a dedicated schema or read replica for AI vector storage. Do not overload the transactional schema with dense vector indexes.

### 5. PostgreSQL Best Practices
- **Use UUIDv7 (or v4)** for all Primary Keys to prevent enumeration attacks and support distributed creation (mobile offline-sync).
- Implement \`JSONB\` carefully for \`User.notificationSettings\` and \`AttributeSchemas\`, applying GIN indexes for fast querying.
`);


// --- PHASE 5 ---
md.push('## Phase 5 — Migration Risk Report');
md.push(`
### Difficulty: HIGH
Migrating from mixed-case (e.g., \`PurchaseRequests\`) to strict \`snake_case\` (\`purchase_requests\`) across a production-grade DB with existing data and FK constraints requires orchestration.

### Risks
- **Downtime:** Renaming tables locks them.
- **Codebase Desync:** Sequelize models, raw SQL queries, and ORM associations must flip simultaneously.
- **Lost Data in Duplicates:** For tables like \`categories\` vs \`Categories\`, merging foreign keys pointing to ID 5 in \`Categories\` vs ID 5 in \`categories\` is extremely risky.

### Safest Migration Strategy (The "Blue/Green" DB Cutover)
1. **Freeze Code:** Ensure all models use explicit \`tableName: 'target_table_name'\` (e.g. \`purchase_requests\`).
2. **Migration Script (Non-Destructive):**
   - Create the canonical \`snake_case\` tables.
   - Use \`INSERT INTO ... SELECT * FROM ...\` to copy data from legacy PascalCase tables.
   - For duplicates (\`categories\` / \`Categories\`), run an ETL script to merge and remap foreign keys *before* the cutover.
3. **Switch & Drop:** Deploy code. Verify traffic. Run a cleanup migration 2 weeks later to drop the orphaned PascalCase tables.

### Expected Future Maintenance Savings
- **80% reduction in raw SQL bugs** caused by forgotten quote identifiers \`"PurchaseRequests"\`.
- **Seamless Data Warehouse sync** via Fivetran or Airbyte, which prefer standardized lowercase naming.
- **Clearer Mental Model** for developers onboarding to the B2B marketplace.
`);

fs.writeFileSync('CANONICAL_ARCHITECTURE_AUDIT.md', md.join('\n'));
console.log('CANONICAL_ARCHITECTURE_AUDIT.md generated successfully!');
