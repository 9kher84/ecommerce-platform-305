const fs = require('fs');

const models = require('./model_report.json');
const analysis = require('./analysis_result.json');

const markdown = [];

markdown.push('# 🏛️ FORENSIC DATABASE BLUEPRINT & ARCHITECTURE TRUTH MAP');
markdown.push('> This is a definitive, zero-modification forensic architecture verification report. Generated automatically.');
markdown.push('');

// --- 1. INSPECT EVERY SEQUELIZE MODEL ---
markdown.push('## 1. Sequelize Models Map');
markdown.push('This section details every parsed Sequelize model, physical table, relations, and usage.');
markdown.push('');

for (const [modelName, model] of Object.entries(models)) {
  const usages = Array.from(new Set(analysis.usages[modelName] || []));
  
  markdown.push(`### \`${modelName}\``);
  markdown.push(`- **Physical Table:** \`${model.physicalTable}\``);
  markdown.push(`- **Explicit tableName:** \`${model.explicitTableName || 'Implicit'}\``);
  
  if (usages.length > 0) {
    markdown.push(`- **Usage (Runtime Code):** Used in ${usages.length} files`);
    // limit list to 5 to keep it readable, but count total
    markdown.push(usages.map(u => `  - \`${u.replace(/\\/g, '/')}\``).join('\n'));
  } else {
    markdown.push(`- **Usage (Runtime Code):** ⚠️ NO DIRECT RUNTIME USAGE DETECTED (Possibly ORPHAN)`);
  }

  if (model.associations && model.associations.length > 0) {
    markdown.push(`- **Associations:**`);
    model.associations.forEach(a => {
      markdown.push(`  - [${a.type}] \`${a.target}\` (FK: \`${a.foreignKey || 'default'}\`)`);
    });
  } else {
    markdown.push(`- **Associations:** None`);
  }

  if (model.indexes && model.indexes.length > 0) {
    markdown.push(`- **Indexes:**`);
    model.indexes.forEach(i => {
      markdown.push(`  - \`${i.name || 'unnamed'}\` on fields: ${i.fields ? i.fields.join(', ') : JSON.stringify(i)}`);
    });
  }
  
  if (model.hooks && model.hooks.length > 0) markdown.push(`- **Hooks:** ${model.hooks.join(', ')}`);
  if (model.scopes && model.scopes.length > 0) markdown.push(`- **Scopes:** ${model.scopes.join(', ')}`);
  
  markdown.push('');
}

// --- 2. MIGRATIONS INSPECTION ---
markdown.push('## 2. Migrations Map');
markdown.push('Trace of physical tables created, altered, or dropped by migrations.');
markdown.push('');

const allCreatedTables = new Set();
const allDroppedTables = new Set();
const allRenamedTables = [];

analysis.migrationsData.forEach(m => {
  markdown.push(`### Migration: \`${m.file}\``);
  if (m.created.length > 0) {
    markdown.push(`- **Created Tables:** ${m.created.map(t => `\`${t}\``).join(', ')}`);
    m.created.forEach(t => allCreatedTables.add(t));
  }
  if (m.dropped.length > 0) {
    markdown.push(`- **Dropped Tables:** ${m.dropped.map(t => `\`${t}\``).join(', ')}`);
    m.dropped.forEach(t => allDroppedTables.add(t));
  }
  if (m.renamed.length > 0) {
    markdown.push(`- **Renamed Tables:**`);
    m.renamed.forEach(r => {
      markdown.push(`  - \`${r.from}\` -> \`${r.to}\``);
      allRenamedTables.push(r);
    });
  }
  markdown.push('');
});

// --- 3. RUNTIME SQL / TABLES ---
markdown.push('## 3. Raw Runtime & Raw SQL Map');
markdown.push(`We found raw SQL usage or \`sequelize.query\` calls in ${analysis.rawQueries.length} files.`);
markdown.push(analysis.rawQueries.map(q => `- \`${q.replace(/\\/g, '/')}\``).join('\n'));
markdown.push('');


// --- 4. DEPENDENCY GRAPH (SIMPLIFIED FOR MD) ---
markdown.push('## 4. Architecture Dependency Graph');
markdown.push('Incoming and Outgoing Foreign Key dependencies per physical table.');
markdown.push('');

const tableDependencies = {};
for (const [modelName, model] of Object.entries(models)) {
  const table = model.physicalTable;
  if (!tableDependencies[table]) tableDependencies[table] = { in: [], out: [] };
  
  if (model.associations) {
    model.associations.forEach(a => {
      const targetTable = models[a.target] ? models[a.target].physicalTable : a.target;
      if (a.type === 'BelongsTo') {
        tableDependencies[table].out.push(`${targetTable} (${a.foreignKey})`);
        if (!tableDependencies[targetTable]) tableDependencies[targetTable] = { in: [], out: [] };
        tableDependencies[targetTable].in.push(`${table} (${a.foreignKey})`);
      }
    });
  }
}

for (const [table, deps] of Object.entries(tableDependencies)) {
  markdown.push(`### Table: \`${table}\``);
  if (deps.in.length > 0) markdown.push(`- **Incoming FKs:** ${[...new Set(deps.in)].join(', ')}`);
  else markdown.push(`- **Incoming FKs:** None`);
  
  if (deps.out.length > 0) markdown.push(`- **Outgoing FKs:** ${[...new Set(deps.out)].join(', ')}`);
  else markdown.push(`- **Outgoing FKs:** None`);
  markdown.push('');
}


// --- 5. DETECT DUPLICATE ENTITIES ---
markdown.push('## 5. Duplicate Entities Analysis');
markdown.push('Detecting mismatch between physical tables and explicit definitions (e.g., Users vs users).');
markdown.push('');

const tableMap = {};
for (const [modelName, model] of Object.entries(models)) {
  const norm = model.physicalTable.toLowerCase();
  if (!tableMap[norm]) tableMap[norm] = [];
  tableMap[norm].push(model.physicalTable);
}

for (const [norm, forms] of Object.entries(tableMap)) {
  const uniqueForms = [...new Set(forms)];
  if (uniqueForms.length > 1) {
    markdown.push(`- ⚠️ **Duplicate Tables detected for entity \`${norm}\`**: ${uniqueForms.map(f => `\`${f}\``).join(' vs ')}`);
  }
}
markdown.push('*(Note: Further discrepancies between Migration casing and Model casing must be cross-checked manually. Commonly `Users` vs `users` occurs if explicitly forced in sequelize.)*');
markdown.push('');

// --- 6. CLASSIFICATION ---
markdown.push('## 6. Final Canonical Architecture (Classification)');
markdown.push('Classifying tables according to functional domain.');
markdown.push('');

const domains = {
  CORE: ['User', 'Organization', 'Role', 'Permission', 'UserRole', 'RolePermission', 'Team', 'City', 'Region', 'Category', 'UserCategory', 'AssetType'],
  DOMAIN: ['Product', 'ProductDNA', 'ProductDNAAttribute', 'PurchaseRequest', 'PurchaseRequestItem', 'PurchaseRequestInvitation', 'PurchaseOrder', 'PurchaseOrderLine', 'Quotation', 'QuotationItem', 'Deal', 'SellerListing', 'Shipment', 'ShipmentLine', 'AlternativeQuote', 'SmartInventory', 'AutoReplenishmentOrder', 'Award', 'AwardLine', 'Receipt', 'ReceiptLine', 'Invoice'],
  SUPPORT: ['Message', 'Notification', 'ActionLog', 'AdminActionLog', 'EventLog', 'Report', 'Rating', 'FailedNotification', 'SLARecord', 'WithdrawalLog'],
  SECURITY: ['RefreshToken', 'AuditLog', 'Sanction', 'TrustScore'],
  ANALYTICS: ['MarketSilenceEvent', 'SellerInteractionEvent', 'BuyerDecisionContext', 'SellerDecision', 'InventoryMetrics'],
  CACHE: [],
  LEGACY: [],
  ORPHAN: [],
};

for (const [modelName, model] of Object.entries(models)) {
  let matchedDomain = 'ORPHAN';
  const usages = analysis.usages[modelName] || [];
  
  if (usages.length === 0) {
    matchedDomain = 'ORPHAN';
  } else {
    for (const [domain, list] of Object.entries(domains)) {
      if (list.includes(modelName)) {
        matchedDomain = domain;
        break;
      }
    }
    if (matchedDomain === 'ORPHAN') matchedDomain = 'SUPPORT'; // Fallback if used
  }
  
  markdown.push(`- **${modelName}** (\`${model.physicalTable}\`) -> \`${matchedDomain}\``);
}
markdown.push('');


// --- 7. FUTURE ARCHITECTURE DESIGN ---
markdown.push('## 7. Future Architecture Design (B2B Marketplace)');
markdown.push(`
> **Notice:** Safest long-term architecture for this specific platform.

### Requirements Supported
- AI, Marketplace, Procurement, Inventory, Quotations, RFQ Workflow, Future ERP, Future BI, Future ML

### The Blueprint Strategy
1. **Core Data Immutability:** Never DELETE records in Core/Domain (use Soft Deletes). 
2. **AI Read Layer:** Implement Read Replicas dedicated to AI context retrieval and Semantic Search (pgvector).
3. **Analytics Layer:** Separate Data Warehouse for BI. Use asynchronous replication or ETL jobs for \`EventLog\`, \`MarketSilenceEvent\`.
4. **Caching & Queue:** Redis for volatile state (sessions, live bids, websocket states, caching user permissions).

### Future Structural Layers
- \`L1 (Operational DB)\`: Highly normalized. Postgres. Handling Transactions, RFQs, Quotes.
- \`L2 (AI/Search Vector Layer)\`: Extracted ProductDNA, User profiles encoded via embeddings.
- \`L3 (Data Warehouse / BI)\`: Parquet/Clickhouse for historical analytics, SLA tracking, TrustScore modeling.
`);


// --- 8. COMPLETE BLUEPRINT ---
markdown.push('## 8. Complete Database Blueprint Visualization');
markdown.push(`
\`\`\`mermaid
graph TD
    subgraph Operational DB (Production)
      User --- Organization
      Organization --- Product
      User --- PurchaseRequest
      PurchaseRequest --- Quotation
      Quotation --- PurchaseOrder
      PurchaseOrder --- Invoice
      PurchaseOrder --- Shipment
    end
    
    subgraph AI Read Layer (Search/Semantic)
      Product_Vectors[ProductDNA Vectors]
      Supplier_Vectors[Supplier Profiles]
    end
    
    subgraph Analytics & ML (Future BI)
      BI_Events[SellerInteractionEvent]
      BI_Decisions[BuyerDecisionContext]
      BI_SLA[SLARecord]
    end
    
    Operational DB -.->|ETL / CDC| AI Read Layer
    Operational DB -.->|ETL / Logs| Analytics & ML
\`\`\`
`);

fs.writeFileSync('DATABASE_BLUEPRINT.md', markdown.join('\n'));
console.log('Blueprint generated at DATABASE_BLUEPRINT.md');
